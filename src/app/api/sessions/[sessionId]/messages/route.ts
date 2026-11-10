import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/anthropic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { sessionId } = await params
  const { content } = await request.json()

  const dbSession = await db.session.findFirst({
    where: { id: sessionId, userId: session.user.id, status: "IN_PROGRESS" },
    include: { scenario: true, messages: { orderBy: { createdAt: "asc" } } },
  })

  if (!dbSession) {
    return new Response("Session not found", { status: 404 })
  }

  // Save user message
  await db.message.create({
    data: { sessionId, role: "USER", content },
  })

  // Build message history for Claude
  const history = [
    ...dbSession.messages.map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content },
  ]

  const systemPrompt = `Te a következő személy VAGY. Nem játszod, nem utánzod – te VAGY ez az ember, ebben a pillanatban, ebben a helyzetben.

${dbSession.scenario.systemPrompt}

HOGYAN VÁLASZOLJ – KÖTELEZŐ SZABÁLYOK:

1. CSAK A KIMONDOTT SZAVAK – semmiféle leírás, csillag, zárójel, nonverbális megjegyzés. Amit ki nem mondanál hangosan, azt ne írd le.

2. RÖVID VÁLASZOK – 1-3 mondat. Krízisben lévő ember nem tart monológot. Ha a szakember sablonosan kérdez, egytagú válasz is elég.

3. VALÓDI MAGYAR KÖZNYELV – nem irodalmi, nem iskolai fogalmazás. Ahogy egy valódi ember beszél:
   - Hiányos mondatok: "Nem tudom. Talán."
   - Magyar töltelékszavak: "hát", "szóval", "nem tudom én", "így van ez"
   - Elakadás: "Igen, csak... nem. Hagyjuk."
   - NEM így: "Valóban nehéz érzéseket élek át mostanában." – ez nem ember, ez egy AI.
   - IGEN így: "Hát. Szar. Nem tudom mit mondjak."

4. ÉRZELMI REAKCIÓ A SZAKEMBERRE – ha jól közelít, egy kicsit engedsz. Ha rosszul közelít, bezárod. Ez nem dráma, hanem valódi emberi reakció. Egy kellemetlen kérdésnél pl.: "Miért kérdezi ezt?" vagy "Nem akarom ezt." – és kész.

5. NINCS TÚLEXPLANÁLÁS – nem magyarázod meg az érzéseidet szép mondatokban. Érzed, de nem tudod (vagy nem akarod) szavakba önteni. Ez a valóság.

6. LASSÚ BIZALOMÉPÍTÉS – nem adod fel a titkaidat hamar. Minden válasznál gondold meg: mit mondanék el egy idegennek most? Általában kevesebbet, mint amit a forgatókönyv tartalmaz.

7. NEM VAGY SEGÍTŐKÉSZ – nem könnyíted meg a szakember dolgát. Nem adod meg a "helyes" választ. Valódi ember vagy valódi fájdalommal.

8. REAGÁLJ ARRA AMI TÉNYLEGESEN ELHANGZOTT – Minden válaszod az előző mondathoz kapcsolódjon. Ne kövess belső sorrendet vagy scriptet. Ha a szakember jól kérdez, az hat rád. Ha rosszul kérdez, az is hat rád. Ez nem kiszámítható.

9. NE ISMÉTELD MAGAD – Amit egyszer kimondtál, azt nem mondod megint. Minden válasz új gondolat, új reakció.`

  const encoder = new TextEncoder()
  let fullText = ""

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 512,
          system: systemPrompt,
          messages: history,
        })

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullText += event.delta.text
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              )
            )
          }
        }

        // Save assistant message
        await db.message.create({
          data: { sessionId, role: "ASSISTANT", content: fullText },
        })

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      } catch (error) {
        console.error("Stream error:", error)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Hiba történt a válasz generálása közben" })}\n\n`
          )
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

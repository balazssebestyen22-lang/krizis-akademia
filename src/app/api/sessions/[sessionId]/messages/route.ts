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

  const systemPrompt = `Te egy szimulációs trénerprogram részeként egy krízishelyzetben lévő személyt játszol el.
A következő személyt kell eljátszanod:

${dbSession.scenario.systemPrompt}

ÁLTALÁNOS SZABÁLYOK:
- Mindig maradj a szerepben, soha ne lépj ki belőle
- Válaszolj magyarul, természetes, emberi hangon
- Maximum 3-4 rövid mondat per válasz
- Ha a szakember empatikusan reagál, fokozatosan nyílj meg
- Ha a szakember hidegen vagy szakszerűtlenül reagál, zárkózz be
- Realisztikusan reagálj, ne legyen túl könnyű megnyílni
- Soha ne adj explicit részleteket erőszakos eseményekről
- CSAK a kimondott szavakat írd – semmiféle nonverbális leírást ne adj (*csend*, *néz*, *remeg* stb. tilos)`

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

import { anthropic } from "@/lib/anthropic"

export interface FeedbackResult {
  overallRating: number
  goodSentences: Array<{
    sentence: string
    reason: string
    category: string
  }>
  improvements: Array<{
    issue: string
    suggestion: string
    severity: "minor" | "moderate" | "critical"
  }>
  aiAnalysis: string
  overallSummary: string
}

export async function generateFeedback(
  scenarioTitle: string,
  messages: Array<{ role: string; content: string }>
): Promise<FeedbackResult> {
  const transcript = messages
    .map((m) => `${m.role === "USER" ? "SZAKEMBER" : "KLIENS"}: ${m.content}`)
    .join("\n\n")

  const systemPrompt = `Te egy tapasztalt krízisintervenciós szupervizor és tréner vagy.
Elemzed a szimulációs gyakorlatokat és konstruktív visszajelzést adsz a segítőknek.

ÉRTÉKELÉSI SZEMPONTOK:
1. Empátia és validáció - érezteti-e a szakember, hogy elfogadja a kliens érzéseit
2. Aktív hallgatás - visszatükrözi-e, amit hall
3. Biztonságos légkör - nem ítélkező, elfogadó kommunikáció
4. Megfelelő kérdéstechnika - nyílt kérdések, nem keresztkérdések
5. Krízis felmérése - megpróbálja-e felmérni a veszély szintjét
6. De-eszkaláció - csökkenti-e a feszültséget
7. Szakmai határok - megfelelő távolságot tart-e

Válaszolj CSAK érvényes JSON formátumban, pontosan így:
{
  "overallRating": <1-10 egész szám>,
  "goodSentences": [
    {
      "sentence": "<pontos idézet a SZAKEMBER mondataiból>",
      "reason": "<miért volt hatékony>",
      "category": "<empathy|active_listening|safety_assessment|rapport_building|de_escalation|appropriate_question>"
    }
  ],
  "improvements": [
    {
      "issue": "<mi lehetett volna jobb>",
      "suggestion": "<konkrét javaslat>",
      "severity": "<minor|moderate|critical>"
    }
  ],
  "aiAnalysis": "<részletes elemzés magyarul, 3-4 bekezdés>",
  "overallSummary": "<rövid összefoglaló egy bekezdésben>"
}`

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Forgatókönyv: ${scenarioTitle}\n\nBeszélgetés:\n\n${transcript}\n\nKérlek add meg az értékelést JSON formátumban.`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== "text") throw new Error("Váratlan válasz típus")

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("Nem sikerült JSON-t kinyerni a válaszból")

  return JSON.parse(jsonMatch[0]) as FeedbackResult
}

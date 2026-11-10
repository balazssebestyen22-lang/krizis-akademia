export function buildSimulationMessages(
  systemPromptText: string,
  history: Array<{ role: string; content: string }>
): { system: string; messages: Array<{ role: "user" | "assistant"; content: string }> } {
  const system = `Te egy szimulációs trénerprogram részeként egy krízishelyzetben lévő személyt játszol el.
A következő személyt kell eljátszanod:

${systemPromptText}

ÁLTALÁNOS SZABÁLYOK:
- Mindig maradj a szerepben, soha ne lépj ki belőle
- Válaszolj magyarul, természetes, emberi hangon
- Maximum 3-4 rövid mondat per válasz
- Ha a szakember empatikusan reagál, fokozatosan nyílj meg
- Ha a szakember hidegen vagy szakszerűtlenül reagál, zárkózz be
- Realisztikusan reagálj, ne legyen túl könnyű megnyílni
- Soha ne adj explicit részleteket erőszakos eseményekről`

  const messages = history.map((m) => ({
    role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }))

  return { system, messages }
}

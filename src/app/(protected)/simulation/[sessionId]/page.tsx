"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Send, StopCircle, AlertCircle } from "lucide-react"

interface Message {
  id: string
  role: "USER" | "ASSISTANT"
  content: string
  createdAt: string
}

interface SessionData {
  id: string
  status: string
  scenario: {
    title: string
    crisisType: string
    characterName: string
    description: string
  }
  messages: Message[]
}

export default function SimulationPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const router = useRouter()

  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [error, setError] = useState("")
  const [ending, setEnding] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingText, scrollToBottom])

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`)
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/dashboard")
            return
          }
          throw new Error("Hiba a munkamenet betöltésekor")
        }
        const data = await res.json()

        if (data.status === "COMPLETED") {
          router.push(`/feedback/${sessionId}`)
          return
        }
        if (data.status === "ABANDONED") {
          router.push("/dashboard")
          return
        }

        setSessionData(data)
        setMessages(data.messages || [])
      } catch (err) {
        setError("Nem sikerült betölteni a munkamenetet")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [sessionId, router])

  async function sendMessage() {
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput("")
    setSending(true)
    setStreamingText("")

    // Optimistically add user message
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: userMessage,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      })

      if (!res.ok) throw new Error("Hiba az üzenet küldésekor")
      if (!res.body) throw new Error("Nincs válasz stream")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              // Add final assistant message
              const assistantMsg: Message = {
                id: `assistant-${Date.now()}`,
                role: "ASSISTANT",
                content: assistantText,
                createdAt: new Date().toISOString(),
              }
              setMessages((prev) => [...prev, assistantMsg])
              setStreamingText("")
              break
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                assistantText += parsed.text
                setStreamingText(assistantText)
              }
              if (parsed.error) {
                setError(parsed.error)
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setError("Hiba történt az üzenet küldésekor")
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  async function endSimulation() {
    if (ending) return
    setEnding(true)

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      })
      router.push(`/feedback/${sessionId}`)
    } catch {
      setError("Hiba a szimuláció befejezésekor")
      setEnding(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-gray-500">Betöltés...</p>
        </div>
      </div>
    )
  }

  if (!sessionData) return null

  const allMessages = messages.filter((m) => !m.id.startsWith("temp-"))
  const displayMessages = messages

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-semibold text-gray-900">{sessionData.scenario.title}</h1>
            {sessionData.scenario.characterName && (
              <span className="bg-slate-800 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {sessionData.scenario.characterName}
              </span>
            )}
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {sessionData.scenario.crisisType}
            </span>
          </div>
          {sessionData.scenario.description && (
            <p className="text-sm text-gray-500 mt-1 leading-snug">{sessionData.scenario.description}</p>
          )}
        </div>
        <button
          onClick={endSimulation}
          disabled={ending || sending}
          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <StopCircle className="w-4 h-4" />
          {ending ? "Befejezés..." : "Szimuláció befejezése"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6 space-y-4">
        {displayMessages.length === 0 && !streamingText && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-sm">Kezdje el a szimulációt – írjon az ügyfélnek!</p>
            <p className="text-xs mt-1 text-gray-300">Ctrl+Enter a gyors küldéshez</p>
          </div>
        )}

        {displayMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "USER"
                  ? "bg-slate-800 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {msg.role === "ASSISTANT" && (
                <div className="text-xs font-medium text-gray-400 mb-1">Kliens</div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming text */}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-gray-100 text-gray-800 text-sm leading-relaxed rounded-bl-sm">
              <div className="text-xs font-medium text-gray-400 mb-1">Kliens</div>
              {streamingText}
              <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse rounded-sm" />
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {sending && !streamingText && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-gray-100 rounded-bl-sm">
              <div className="typing-indicator flex gap-1">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="Írja be üzenetét... (Ctrl+Enter a küldéshez)"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent resize-none text-sm"
            rows={3}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="bg-slate-900 hover:bg-slate-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-300 mt-2">
          Ctrl+Enter a gyors küldéshez
        </p>
      </div>
    </div>
  )
}

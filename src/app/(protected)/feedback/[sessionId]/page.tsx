"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Star,
  ThumbsUp,
  TrendingUp,
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
} from "lucide-react"

interface GoodSentence {
  sentence: string
  reason: string
  category: string
}

interface Improvement {
  issue: string
  suggestion: string
  severity: "minor" | "moderate" | "critical"
}

interface FeedbackData {
  overallRating: number
  goodSentences: GoodSentence[]
  improvements: Improvement[]
  aiAnalysis: string
  overallSummary: string
}

const CATEGORY_LABELS: Record<string, string> = {
  empathy: "Empátia",
  active_listening: "Aktív hallgatás",
  safety_assessment: "Biztonság felmérése",
  rapport_building: "Kapcsolatépítés",
  de_escalation: "De-eszkaláció",
  appropriate_question: "Megfelelő kérdés",
}

const SEVERITY_CONFIG = {
  minor: {
    label: "Kisebb megjegyzés",
    color: "bg-blue-50 border-blue-200 text-blue-800",
    icon: CheckCircle,
    iconColor: "text-blue-500",
  },
  moderate: {
    label: "Közepes fontosságú",
    color: "bg-amber-50 border-amber-200 text-amber-800",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  critical: {
    label: "Kritikus",
    color: "bg-red-50 border-red-200 text-red-800",
    icon: AlertCircle,
    iconColor: "text-red-500",
  },
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <Star
          key={n}
          className={`w-5 h-5 ${
            n <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  )
}

export default function FeedbackPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const router = useRouter()

  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function generateFeedback() {
      try {
        const res = await fetch(`/api/feedback/${sessionId}`, {
          method: "POST",
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Hiba az értékelés generálásakor")
        }

        const data = await res.json()
        setFeedback(data)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Ismeretlen hiba"
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    generateFeedback()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mb-4"></div>
        <p className="text-gray-600 font-medium">Visszajelzés generálása...</p>
        <p className="text-sm text-gray-400 mt-1">Ez eltarthat néhány másodpercig</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 text-slate-700 hover:underline text-sm"
        >
          Vissza a főoldalra
        </button>
      </div>
    )
  }

  if (!feedback) return null

  const ratingColor =
    feedback.overallRating >= 8
      ? "text-green-600"
      : feedback.overallRating >= 5
      ? "text-yellow-600"
      : "text-red-600"

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Vissza a főoldalra
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Szimulációs értékelés</h1>
      </div>

      {/* Rating Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="text-center">
            <div className={`text-7xl font-bold ${ratingColor}`}>
              {feedback.overallRating}
            </div>
            <div className="text-gray-400 text-sm mt-1">/ 10</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-gray-700">Összpontszám</span>
            </div>
            <RatingStars rating={feedback.overallRating} />
            <p className="mt-4 text-gray-600 leading-relaxed">{feedback.overallSummary}</p>
          </div>
        </div>
      </div>

      {/* Good Sentences */}
      {feedback.goodSentences && feedback.goodSentences.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-500" />
            Kiemelkedő mondatok
          </h2>
          <div className="space-y-4">
            {feedback.goodSentences.map((item, i) => (
              <div key={i} className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <blockquote className="text-gray-700 font-medium italic mb-2">
                      &ldquo;{item.sentence}&rdquo;
                    </blockquote>
                    <p className="text-sm text-gray-600">{item.reason}</p>
                    <span className="inline-block mt-2 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {feedback.improvements && feedback.improvements.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Fejlesztési lehetőségek
          </h2>
          <div className="space-y-4">
            {feedback.improvements.map((item, i) => {
              const config = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.minor
              const Icon = config.icon
              return (
                <div key={i} className={`border rounded-xl p-4 ${config.color}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
                    <div>
                      <p className="font-medium mb-1">{item.issue}</p>
                      <p className="text-sm opacity-80">{item.suggestion}</p>
                      <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-white/50">
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-700" />
          Részletes elemzés
        </h2>
        <div className="text-gray-600 leading-relaxed whitespace-pre-line">
          {feedback.aiAnalysis}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/dashboard"
          className="bg-slate-900 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-medium transition-colors text-center"
        >
          Vissza a főoldalra
        </Link>
      </div>
    </div>
  )
}

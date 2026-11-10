export const DIFFICULTY_LABELS = {
  BEGINNER: "Kezdő",
  INTERMEDIATE: "Közepes",
  ADVANCED: "Haladó",
} as const

export const DIFFICULTY_COLORS = {
  BEGINNER: "bg-green-50 text-green-700",
  INTERMEDIATE: "bg-amber-50 text-amber-700",
  ADVANCED: "bg-red-50 text-red-700",
} as const

export const STATUS_LABELS = {
  IN_PROGRESS: "Folyamatban",
  COMPLETED: "Befejezett",
  ABANDONED: "Megszakított",
} as const

export const STATUS_COLORS = {
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-green-50 text-green-700",
  ABANDONED: "bg-gray-100 text-gray-500",
} as const

export interface ScenarioType {
  id: string
  title: string
  description: string
  crisisType: string
  difficulty: keyof typeof DIFFICULTY_LABELS
  systemPrompt: string
  isActive: boolean
  createdAt: Date
}

export interface SessionType {
  id: string
  userId: string
  scenarioId: string
  startedAt: Date
  endedAt: Date | null
  status: keyof typeof STATUS_LABELS
  scenario?: ScenarioType
  messages?: MessageType[]
  feedback?: FeedbackType | null
}

export interface MessageType {
  id: string
  sessionId: string
  role: "USER" | "ASSISTANT"
  content: string
  createdAt: Date
}

export interface FeedbackType {
  id: string
  sessionId: string
  overallRating: number
  goodSentences: string
  improvements: string
  aiAnalysis: string
  overallSummary: string
  createdAt: Date
}

"use client"

import { useState, useEffect } from "react"
import { BookOpen, Eye, EyeOff, Plus, X } from "lucide-react"

interface ScenarioData {
  id: string
  title: string
  crisisType: string
  difficulty: string
  isActive: boolean
  createdAt: string
  _count: { sessions: number }
}

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "Kezdő",
  INTERMEDIATE: "Közepes",
  ADVANCED: "Haladó",
}

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-green-100 text-green-800",
  INTERMEDIATE: "bg-yellow-100 text-yellow-800",
  ADVANCED: "bg-red-100 text-red-800",
}

export default function AdminScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    crisisType: "",
    difficulty: "BEGINNER",
    systemPrompt: "",
  })

  useEffect(() => {
    fetchScenarios()
  }, [])

  async function fetchScenarios() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/scenarios")
      const data = await res.json()
      setScenarios(data)
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(scenarioId: string, currentActive: boolean) {
    setActionLoading(scenarioId)
    try {
      await fetch(`/api/admin/scenarios/${scenarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      await fetchScenarios()
    } finally {
      setActionLoading(null)
    }
  }

  async function createScenario(e: React.FormEvent) {
    e.preventDefault()
    setActionLoading("create")
    try {
      const res = await fetch("/api/admin/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({
          title: "",
          description: "",
          crisisType: "",
          difficulty: "BEGINNER",
          systemPrompt: "",
        })
        await fetchScenarios()
      }
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-[#0d7377]" />
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Forgatókönyvek</h1>
          <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {scenarios.length} db
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#152b47] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Mégse" : "Új forgatókönyv"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-[#1e3a5f] mb-4">Új forgatókönyv létrehozása</h2>
          <form onSubmit={createScenario} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cím</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7377]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Krízis típusa
                </label>
                <input
                  type="text"
                  value={form.crisisType}
                  onChange={(e) => setForm({ ...form, crisisType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7377]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leírás</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7377]"
                rows={2}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nehézség</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7377]"
              >
                <option value="BEGINNER">Kezdő</option>
                <option value="INTERMEDIATE">Közepes</option>
                <option value="ADVANCED">Haladó</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rendszer prompt
              </label>
              <textarea
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7377] font-mono"
                rows={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading === "create"}
              className="bg-[#1e3a5f] hover:bg-[#152b47] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading === "create" ? "Mentés..." : "Forgatókönyv létrehozása"}
            </button>
          </form>
        </div>
      )}

      {/* Scenarios List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Forgatókönyv
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nehézség
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Szimulációk
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Állapot
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Műveletek
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {scenarios.map((scenario) => (
              <tr key={scenario.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 text-sm">{scenario.title}</div>
                  <div className="text-xs text-gray-400">{scenario.crisisType}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      DIFFICULTY_COLORS[scenario.difficulty] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {DIFFICULTY_LABELS[scenario.difficulty] || scenario.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{scenario._count.sessions}</td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      scenario.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {scenario.isActive ? "Aktív" : "Inaktív"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(scenario.id, scenario.isActive)}
                    disabled={actionLoading === scenario.id}
                    className="flex items-center gap-1.5 text-xs text-[#0d7377] hover:underline font-medium disabled:opacity-50"
                  >
                    {scenario.isActive ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Deaktiválás
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Aktiválás
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { db } from "@/lib/db"
import { Users, MessageCircle, CheckCircle, Star, BookOpen } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const [totalUsers, totalSessions, completedSessions, feedbacks, sessionsByScenario] =
    await Promise.all([
      db.user.count(),
      db.session.count(),
      db.session.count({ where: { status: "COMPLETED" } }),
      db.feedback.aggregate({ _avg: { overallRating: true } }),
      db.session.groupBy({
        by: ["scenarioId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ])

  const scenarioIds = sessionsByScenario.map((s) => s.scenarioId)
  const scenarios = await db.scenario.findMany({
    where: { id: { in: scenarioIds } },
    select: { id: true, title: true },
  })
  const scenarioMap = Object.fromEntries(scenarios.map((s) => [s.id, s.title]))

  const stats = [
    {
      label: "Összes felhasználó",
      value: totalUsers,
      icon: Users,
      color: "bg-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Összes szimuláció",
      value: totalSessions,
      icon: MessageCircle,
      color: "bg-teal-500",
      bg: "bg-teal-50",
    },
    {
      label: "Befejezett szimulációk",
      value: completedSessions,
      icon: CheckCircle,
      color: "bg-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Átlagos értékelés",
      value: feedbacks._avg.overallRating
        ? `${feedbacks._avg.overallRating.toFixed(1)}/10`
        : "–",
      icon: Star,
      color: "bg-yellow-500",
      bg: "bg-yellow-50",
    },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#1e3a5f] mb-6">Áttekintés</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className={`inline-flex p-3 rounded-xl ${stat.bg} mb-4`}>
                <Icon className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Top Scenarios */}
      {sessionsByScenario.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0d7377]" />
            Legnépszerűbb forgatókönyvek
          </h2>
          <div className="space-y-3">
            {sessionsByScenario.map((s, i) => (
              <div key={s.scenarioId} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {scenarioMap[s.scenarioId] ?? "Ismeretlen"}
                  </div>
                </div>
                <div className="text-sm font-semibold text-[#0d7377]">{s._count.id} db</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

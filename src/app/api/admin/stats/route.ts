import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nincs jogosultság" }, { status: 403 })
  }

  try {
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
        }),
      ])

    // Enrich sessionsByScenario with scenario titles
    const scenarioIds = sessionsByScenario.map((s) => s.scenarioId)
    const scenarios = await db.scenario.findMany({
      where: { id: { in: scenarioIds } },
      select: { id: true, title: true },
    })
    const scenarioMap = Object.fromEntries(scenarios.map((s) => [s.id, s.title]))

    return NextResponse.json({
      totalUsers,
      totalSessions,
      completedSessions,
      averageRating: feedbacks._avg.overallRating ?? 0,
      sessionsByScenario: sessionsByScenario.map((s) => ({
        scenarioId: s.scenarioId,
        title: scenarioMap[s.scenarioId] ?? "Ismeretlen",
        count: s._count.id,
      })),
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

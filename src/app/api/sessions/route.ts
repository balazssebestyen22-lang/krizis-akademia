import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nem vagy bejelentkezve" }, { status: 401 })
  }

  try {
    const { scenarioId } = await request.json()
    if (!scenarioId) {
      return NextResponse.json({ error: "Hiányzó scenarioId" }, { status: 400 })
    }

    const scenario = await db.scenario.findUnique({ where: { id: scenarioId, isActive: true } })
    if (!scenario) {
      return NextResponse.json({ error: "Forgatókönyv nem található" }, { status: 404 })
    }

    const dbSession = await db.session.create({
      data: {
        userId: session.user.id,
        scenarioId,
      },
    })

    return NextResponse.json({ sessionId: dbSession.id })
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nem vagy bejelentkezve" }, { status: 401 })
  }

  try {
    const sessions = await db.session.findMany({
      where: { userId: session.user.id },
      include: {
        scenario: {
          select: { id: true, title: true, crisisType: true, difficulty: true },
        },
        feedback: {
          select: { overallRating: true },
        },
      },
      orderBy: { startedAt: "desc" },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Sessions fetch error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

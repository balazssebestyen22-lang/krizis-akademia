import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null
  }
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Nincs jogosultság" }, { status: 403 })
  }

  try {
    const scenarios = await db.scenario.findMany({
      include: { _count: { select: { sessions: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(scenarios)
  } catch (error) {
    console.error("Admin scenarios fetch error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Nincs jogosultság" }, { status: 403 })
  }

  try {
    const { title, description, crisisType, difficulty, systemPrompt } = await request.json()

    const scenario = await db.scenario.create({
      data: { title, description, crisisType, difficulty, systemPrompt },
    })

    return NextResponse.json(scenario)
  } catch (error) {
    console.error("Admin scenario create error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

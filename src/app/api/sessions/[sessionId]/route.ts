import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nem vagy bejelentkezve" }, { status: 401 })
  }

  const { sessionId } = await params

  try {
    const dbSession = await db.session.findFirst({
      where: { id: sessionId, userId: session.user.id },
      include: {
        scenario: true,
        messages: { orderBy: { createdAt: "asc" } },
        feedback: true,
      },
    })

    if (!dbSession) {
      return NextResponse.json({ error: "Munkamenet nem található" }, { status: 404 })
    }

    return NextResponse.json(dbSession)
  } catch (error) {
    console.error("Session fetch error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nem vagy bejelentkezve" }, { status: 401 })
  }

  const { sessionId } = await params

  try {
    const { status } = await request.json()
    const isTerminal = status === "COMPLETED" || status === "ABANDONED"

    const dbSession = await db.session.updateMany({
      where: { id: sessionId, userId: session.user.id },
      data: {
        status,
        ...(isTerminal ? { endedAt: new Date() } : {}),
      },
    })

    if (dbSession.count === 0) {
      return NextResponse.json({ error: "Munkamenet nem található" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Session update error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

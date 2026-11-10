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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Nincs jogosultság" }, { status: 403 })
  }

  const { scenarioId } = await params

  try {
    const data = await request.json()
    const scenario = await db.scenario.update({
      where: { id: scenarioId },
      data,
    })
    return NextResponse.json(scenario)
  } catch (error) {
    console.error("Admin scenario update error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Nincs jogosultság" }, { status: 403 })
  }

  const { scenarioId } = await params

  try {
    // Soft delete - set isActive = false
    await db.scenario.update({
      where: { id: scenarioId },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin scenario delete error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

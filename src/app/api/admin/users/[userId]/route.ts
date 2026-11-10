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
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Nincs jogosultság" }, { status: 403 })
  }

  const { userId } = await params

  try {
    const { role, name } = await request.json()
    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(name !== undefined ? { name } : {}),
      },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Admin user update error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Nincs jogosultság" }, { status: 403 })
  }

  const { userId } = await params

  // Prevent self-deletion
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Saját magad nem törölheted" }, { status: 400 })
  }

  try {
    await db.user.delete({ where: { id: userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin user delete error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

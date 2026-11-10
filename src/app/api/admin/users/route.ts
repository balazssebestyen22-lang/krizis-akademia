import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

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
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Admin users fetch error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Nincs jogosultság" }, { status: 403 })
  }

  try {
    const { name, email, password, role } = await request.json()

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "Ez az e-mail cím már foglalt" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await db.user.create({
      data: { name, email, passwordHash, role: role || "USER" },
    })

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role })
  } catch (error) {
    console.error("Admin user create error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

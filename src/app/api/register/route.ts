import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2, "A névnek legalább 2 karakter hosszúnak kell lennie"),
  email: z.string().email("Érvénytelen e-mail cím"),
  password: z.string().min(8, "A jelszónak legalább 8 karakter hosszúnak kell lennie"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "Ez az e-mail cím már foglalt" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db.user.create({
      data: { name, email, passwordHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Belső szerverhiba" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateFeedback } from "@/lib/claude/feedback"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nem vagy bejelentkezve" }, { status: 401 })
  }

  const { sessionId } = await params

  try {
    // Check if feedback already exists
    const existingFeedback = await db.feedback.findUnique({
      where: { sessionId },
    })

    if (existingFeedback) {
      return NextResponse.json({
        ...existingFeedback,
        goodSentences: JSON.parse(existingFeedback.goodSentences),
        improvements: JSON.parse(existingFeedback.improvements),
      })
    }

    // Get session with messages
    const dbSession = await db.session.findFirst({
      where: { id: sessionId, userId: session.user.id },
      include: {
        scenario: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!dbSession) {
      return NextResponse.json({ error: "Munkamenet nem található" }, { status: 404 })
    }

    if (dbSession.messages.length === 0) {
      return NextResponse.json(
        { error: "Nincs elegendő üzenet az értékeléshez" },
        { status: 400 }
      )
    }

    // Generate feedback
    const feedbackResult = await generateFeedback(
      dbSession.scenario.title,
      dbSession.messages.map((m) => ({ role: m.role, content: m.content }))
    )

    // Save feedback
    const savedFeedback = await db.feedback.create({
      data: {
        sessionId,
        overallRating: feedbackResult.overallRating,
        goodSentences: JSON.stringify(feedbackResult.goodSentences),
        improvements: JSON.stringify(feedbackResult.improvements),
        aiAnalysis: feedbackResult.aiAnalysis,
        overallSummary: feedbackResult.overallSummary,
      },
    })

    // Mark session as completed if still in progress
    await db.session.updateMany({
      where: { id: sessionId, status: "IN_PROGRESS" },
      data: { status: "COMPLETED", endedAt: new Date() },
    })

    return NextResponse.json({
      ...savedFeedback,
      goodSentences: feedbackResult.goodSentences,
      improvements: feedbackResult.improvements,
    })
  } catch (error) {
    console.error("Feedback generation error:", error)
    return NextResponse.json({ error: "Hiba az értékelés generálása közben" }, { status: 500 })
  }
}

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
    const feedback = await db.feedback.findUnique({
      where: { sessionId },
    })

    if (!feedback) {
      return NextResponse.json({ error: "Visszajelzés nem található" }, { status: 404 })
    }

    return NextResponse.json({
      ...feedback,
      goodSentences: JSON.parse(feedback.goodSentences),
      improvements: JSON.parse(feedback.improvements),
    })
  } catch (error) {
    console.error("Feedback fetch error:", error)
    return NextResponse.json({ error: "Belső szerverhiba" }, { status: 500 })
  }
}

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function NewSimulationPage({
  searchParams,
}: {
  searchParams: Promise<{ scenarioId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { scenarioId } = await searchParams

  if (!scenarioId) redirect("/dashboard")

  const scenario = await db.scenario.findUnique({
    where: { id: scenarioId, isActive: true },
  })

  if (!scenario) redirect("/dashboard")

  const dbSession = await db.session.create({
    data: {
      userId: session.user.id,
      scenarioId,
    },
  })

  redirect(`/simulation/${dbSession.id}`)
}

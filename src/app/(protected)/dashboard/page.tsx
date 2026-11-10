import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"

export const dynamic = "force-dynamic"
import { MessageCircle, Clock, CheckCircle, XCircle, Star } from "lucide-react"
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, STATUS_LABELS, STATUS_COLORS } from "@/types"

async function StartSimulationButton({ scenarioId }: { scenarioId: string }) {
  return (
    <form
      action={async () => {
        "use server"
        // This is handled client-side via the link below
      }}
    >
      <Link
        href={`/api/sessions/new?scenarioId=${scenarioId}`}
        className="block"
        onClick={() => {}}
      >
        <span />
      </Link>
    </form>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [scenarios, recentSessions] = await Promise.all([
    db.scenario.findMany({
      where: { isActive: true },
      orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
    }),
    db.session.findMany({
      where: { userId: session.user.id },
      include: {
        scenario: { select: { title: true, crisisType: true } },
        feedback: { select: { overallRating: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Üdvözöljük, {session.user.name}!
        </h1>
        <p className="text-gray-500 mt-2">
          Válasszon egy forgatókönyvet a szimulációs tréning megkezdéséhez.
        </p>
      </div>

      {/* Scenarios */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-slate-700" />
          Elérhető forgatókönyvek
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    DIFFICULTY_COLORS[scenario.difficulty as keyof typeof DIFFICULTY_COLORS]
                  }`}
                >
                  {DIFFICULTY_LABELS[scenario.difficulty as keyof typeof DIFFICULTY_LABELS]}
                </span>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {scenario.crisisType}
                </span>
              </div>

              <h3 className="text-base font-semibold text-gray-900 mb-2">{scenario.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-5">{scenario.description}</p>

              <NewSessionButton scenarioId={scenario.id} />
            </div>
          ))}
        </div>
      </section>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700" />
            Korábbi szimulációk
          </h2>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Forgatókönyv
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dátum
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Állapot
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Értékelés
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 text-sm">{s.scenario.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.scenario.crisisType}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(s.startedAt).toLocaleDateString("hu-HU", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                          STATUS_COLORS[s.status as keyof typeof STATUS_COLORS]
                        }`}
                      >
                        {s.status === "COMPLETED" && <CheckCircle className="w-3 h-3" />}
                        {s.status === "IN_PROGRESS" && <Clock className="w-3 h-3" />}
                        {s.status === "ABANDONED" && <XCircle className="w-3 h-3" />}
                        {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.feedback ? (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium text-gray-900">{s.feedback.overallRating}/10</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">–</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {s.status === "IN_PROGRESS" && (
                          <Link
                            href={`/simulation/${s.id}`}
                            className="text-xs text-slate-700 hover:text-slate-900 font-medium underline underline-offset-2"
                          >
                            Folytatás
                          </Link>
                        )}
                        {s.status === "COMPLETED" && (
                          <Link
                            href={`/feedback/${s.id}`}
                            className="text-xs text-slate-700 hover:text-slate-900 font-medium underline underline-offset-2"
                          >
                            Visszajelzés megtekintése
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function NewSessionButton({ scenarioId }: { scenarioId: string }) {
  return (
    <Link
      href={`/simulation/new?scenarioId=${scenarioId}`}
      className="block w-full text-center bg-slate-900 hover:bg-slate-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
    >
      Szimuláció indítása
    </Link>
  )
}

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth"
import { Shield, LogOut, LayoutDashboard, Settings } from "lucide-react"
import Link from "next/link"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-slate-800" />
              <span className="text-base font-bold text-gray-900">Krízis Akadémia</span>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Főoldal</span>
              </Link>

              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <Settings className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}

              <div className="flex items-center gap-2 pl-4 ml-2 border-l border-gray-200">
                <span className="text-sm text-gray-500">{session.user.name}</span>
                <form
                  action={async () => {
                    "use server"
                    await signOut({ redirectTo: "/login" })
                  }}
                >
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Kijelentkezés</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}

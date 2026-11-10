import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth"
import Link from "next/link"
import { Shield, LayoutDashboard, Users, BookOpen, BarChart2, LogOut } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e3a5f] text-white flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0d7377]" />
            <span className="font-bold">Krízis Akadémia</span>
          </div>
          <p className="text-xs text-blue-300 mt-1">Adminisztrációs panel</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            Áttekintés
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Users className="w-4 h-4" />
            Felhasználók
          </Link>
          <Link
            href="/admin/scenarios"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Forgatókönyvek
          </Link>

          <div className="pt-4 border-t border-white/10 mt-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Felhasználói nézet
            </Link>
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-sm text-blue-200 mb-2 px-3">{session.user.name}</div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 w-full text-sm text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Kijelentkezés
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  )
}

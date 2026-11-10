"use client"

import { useState, useEffect } from "react"
import { Users, Trash2, ShieldCheck, User } from "lucide-react"

interface UserData {
  id: string
  name: string
  email: string
  role: "ADMIN" | "USER"
  createdAt: string
  _count: { sessions: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleRole(userId: string, currentRole: string) {
    setActionLoading(userId + "-role")
    try {
      const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN"
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      await fetchUsers()
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Biztosan törölni szeretné ezt a felhasználót?")) return
    setActionLoading(userId + "-delete")
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      await fetchUsers()
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-[#0d7377]" />
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Felhasználók</h1>
        <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
          {users.length} db
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Felhasználó
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Szerepkör
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Szimulációk
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Regisztrált
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Műveletek
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user.role === "ADMIN" ? (
                      <ShieldCheck className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    {user.role === "ADMIN" ? "Admin" : "Felhasználó"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user._count.sessions}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString("hu-HU")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      disabled={actionLoading === user.id + "-role"}
                      className="text-xs text-[#0d7377] hover:underline font-medium disabled:opacity-50"
                    >
                      {user.role === "ADMIN" ? "Admin elvétele" : "Admin jogok"}
                    </button>
                    <span className="text-gray-200">|</span>
                    <button
                      onClick={() => deleteUser(user.id)}
                      disabled={actionLoading === user.id + "-delete"}
                      className="text-xs text-red-500 hover:underline font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Törlés
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"

type Permit = {
  permitNumber: string
  permitType: string
  permitStatus: string
  permitMilestone: string
  reviewType: string
  applicationStartDate: string
  issueDate: string
  address: string
  workDescription: string
}

export default function PermitsPage() {
  const [permits, setPermits] = useState<Permit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch("/api/permits")
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load permits")
        }

        if (!cancelled) {
          setPermits(json.permits || [])
          setRefreshedAt(json.refreshedAt || null)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="mb-6">
        <a href="/" className="text-sm text-gray-600 hover:underline">
          ← Back to home
        </a>
      </div>

      <h1 className="text-4xl font-bold mb-2">Recent Chicago Permit Activity</h1>
      <p className="text-gray-600 mb-6">
        Recent building permit applications based on Chicago open data.
      </p>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-baseline justify-between gap-6 mb-4">
          <h2 className="text-xl font-semibold">Latest permit applications</h2>
          <div className="text-sm text-gray-500">
            {refreshedAt
              ? `Data refreshed: ${new Date(refreshedAt).toLocaleString()}`
              : ""}
          </div>
        </div>

        {loading && <div className="text-gray-600">Loading…</div>}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
            <div className="font-semibold mb-1">Couldn’t load permit data</div>
            <div className="text-sm whitespace-pre-wrap">{error}</div>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4">Application Date</th>
                  <th className="py-2 pr-4">Address</th>
                  <th className="py-2 pr-4">Permit Type</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Description</th>
                </tr>
              </thead>
              <tbody>
                {permits.map((p) => (
                  <tr key={`${p.permitNumber}-${p.applicationStartDate}`} className="border-b align-top">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {p.applicationStartDate
                        ? new Date(p.applicationStartDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 font-medium min-w-[180px]">
                      {p.address || "—"}
                    </td>
                    <td className="py-3 pr-4 min-w-[160px]">
                      {p.permitType || "—"}
                    </td>
                    <td className="py-3 pr-4 min-w-[140px]">
                      <div>{p.permitStatus || "—"}</div>
                      {p.permitMilestone && (
                        <div className="text-xs text-gray-500 mt-1">
                          {p.permitMilestone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 min-w-[280px] text-gray-700">
                      {p.workDescription || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
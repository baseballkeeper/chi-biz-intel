"use client"

import { useEffect, useState } from "react"

type Row = {
  areaId: string
  name: string
  coffeeShops: number
  population: number
  coffeePer10k: number | null
}

export default function Dashboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch("/api/scores?type=coffee")
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load")
        }

        if (!cancelled) {
          setRows(json.neighborhoods || [])
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

      {/* Navigation */}
      <div className="mb-6">
        <a
          href="/"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to home
        </a>
      </div>

      <h1 className="text-4xl font-bold mb-2">
        Chicago Business Intelligence
      </h1>

      <p className="text-gray-600 mb-6">
        Where should I open a business in Chicago?
      </p>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-baseline justify-between gap-6 mb-4">
          <h2 className="text-xl font-semibold">
            Top Underserved Coffee Markets
          </h2>

          <div className="text-sm text-gray-500">
            {refreshedAt
              ? `Data refreshed: ${new Date(refreshedAt).toLocaleString()}`
              : ""}
          </div>
        </div>

        {loading && (
          <div className="text-gray-600">
            Loading…
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
            <div className="font-semibold mb-1">
              Couldn’t load data
            </div>
            <div className="text-sm whitespace-pre-wrap">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Neighborhood</th>
                <th>Coffee Shops</th>
                <th>Population</th>
                <th>Coffee / 10k</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.areaId} className="border-b">
                  <td className="py-2 font-medium">
                    {r.name}
                  </td>
                  <td>
                    {r.coffeeShops}
                  </td>
                  <td>
                    {r.population.toLocaleString()}
                  </td>
                  <td>
                    {r.coffeePer10k?.toFixed(2) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </main>
  )
}
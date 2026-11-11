
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
  reportedCost: number | null
  communityArea: string
}

type Filters = {
  search: string
  category: string
  status: string
  area: string
  days: string
  minCost: string
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  category: "all",
  status: "all",
  area: "all",
  days: "30",
  minCost: "0",
}

const AREAS = [
  "Rogers Park", "West Ridge", "Uptown", "Lincoln Square",
  "North Center", "Lake View", "Lincoln Park", "Near North Side",
  "Edison Park", "Norwood Park", "Jefferson Park", "Forest Glen",
  "North Park", "Albany Park", "Portage Park", "Irving Park",
  "Dunning", "Montclare", "Belmont Cragin", "Hermosa",
  "Avondale", "Logan Square", "Humboldt Park", "West Town",
  "Austin", "West Garfield Park", "East Garfield Park",
  "Near West Side", "North Lawndale", "South Lawndale",
  "Lower West Side", "Loop", "Near South Side", "Armour Square",
  "Douglas", "Oakland", "Fuller Park", "Grand Boulevard",
  "Kenwood", "Washington Park", "Hyde Park", "Woodlawn",
  "South Shore", "Chatham", "Avalon Park", "South Chicago",
  "Burnside", "Calumet Heights", "Roseland", "Pullman",
  "South Deering", "East Side", "West Pullman", "Riverdale",
  "Hegewisch", "Garfield Ridge", "Archer Heights",
  "Brighton Park", "McKinley Park", "Bridgeport", "New City",
  "West Elsdon", "Gage Park", "Clearing", "West Lawn",
  "Chicago Lawn", "West Englewood", "Englewood",
  "Greater Grand Crossing", "Ashburn", "Auburn Gresham",
  "Beverly", "Washington Heights", "Mount Greenwood",
  "Morgan Park", "O'Hare", "Edgewater",
]

const CATEGORIES = [
  ["all", "All categories"],
  ["roofing", "Roofing"],
  ["hvac", "HVAC"],
  ["electrical", "Electrical"],
  ["plumbing", "Plumbing"],
  ["renovation", "Renovation"],
  ["demolition", "Demolition"],
  ["signs", "Signage"],
]

function formatDate(value: string) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function formatMoney(value: number | null) {
  if (value === null) return "—"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function csvCell(value: string | number | null) {
  let text = String(value ?? "")

  // Protect against spreadsheet formula injection.
  if (/^\s*[=+\-@]/.test(text)) {
    text = "'" + text
  }

  return `"${text.replace(/"/g, '""')}"`
}

function exportCSV(permits: Permit[]) {
  const headers = [
    "Permit Number",
    "Application Date",
    "Issue Date",
    "Address",
    "Community Area",
    "Permit Type",
    "Status",
    "Reported Cost",
    "Description",
  ]

  const rows = permits.map((p) => [
    p.permitNumber,
    p.applicationStartDate,
    p.issueDate,
    p.address,
    AREAS[Number(p.communityArea) - 1] || p.communityArea,
    p.permitType,
    p.permitStatus,
    p.reportedCost,
    p.workDescription,
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = `chicago-permit-leads-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`

  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function PermitsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS)
  const [permits, setPermits] = useState<Permit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null)
  const [limited, setLimited] = useState(false)

  function update(field: keyof Filters, value: string) {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams(applied)
        const response = await fetch(
          `/api/permits?${params.toString()}`,
          { signal: controller.signal }
        )

        const json = await response.json()

        if (!response.ok) {
          throw new Error(
            [json.error, json.details].filter(Boolean).join(": ")
          )
        }

        if (!controller.signal.aborted) {
          setPermits(json.permits || [])
          setRefreshedAt(json.refreshedAt || null)
          setLimited(Boolean(json.limited))
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : String(err)
          )
          setPermits([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => controller.abort()
  }, [applied])

  const issuedCount = permits.filter(
    (p) => Boolean(p.issueDate)
  ).length

  const totalCost = permits.reduce(
    (sum, p) => sum + (p.reportedCost ?? 0),
    0
  )

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 md:px-10">
      <div className="mx-auto max-w-7xl">
        <a
          href="/"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to home
        </a>

        <header className="mb-8 mt-6">
          <h1 className="text-3xl font-bold md:text-4xl">
            Chicago Permit Leads
          </h1>
          <p className="mt-2 text-gray-600">
            Search Chicago building permit activity to identify
            potential business opportunities.
          </p>
        </header>

        <form
          className="rounded-xl bg-white p-5 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault()
            setApplied({ ...filters })
          }}
        >
          <h2 className="mb-4 text-lg font-semibold">
            Search permit records
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium">
              Keyword or street name
              <input
                className={inputClass}
                placeholder="Roof, HVAC, Michigan..."
                value={filters.search}
                onChange={(e) => update("search", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium">
              Work category
              <select
                className={inputClass}
                value={filters.category}
                onChange={(e) => update("category", e.target.value)}
              >
                {CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Community area
              <select
                className={inputClass}
                value={filters.area}
                onChange={(e) => update("area", e.target.value)}
              >
                <option value="all">All Chicago</option>
                {AREAS.map((name, index) => (
                  <option key={name} value={String(index + 1)}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Application date range
              <select
                className={inputClass}
                value={filters.days}
                onChange={(e) => update("days", e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 180 days</option>
                <option value="365">Last 365 days</option>
              </select>
            </label>

            <label className="text-sm font-medium">
              Issue date
              <select
                className={inputClass}
                value={filters.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="all">All records</option>
                <option value="issued">Issue date present</option>
                <option value="pending">No issue date</option>
              </select>
            </label>

            <label className="text-sm font-medium">
              Minimum reported project cost
              <select
                className={inputClass}
                value={filters.minCost}
                onChange={(e) => update("minCost", e.target.value)}
              >
                <option value="0">Any amount</option>
                <option value="10000">$10,000+</option>
                <option value="50000">$50,000+</option>
                <option value="100000">$100,000+</option>
                <option value="500000">$500,000+</option>
                <option value="1000000">$1,000,000+</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              Search permits
            </button>

            <button
              type="button"
              onClick={() => {
                setFilters({ ...DEFAULT_FILTERS })
                setApplied({ ...DEFAULT_FILTERS })
              }}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm hover:bg-gray-100"
            >
              Reset filters
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <strong>Could not load permit data</strong>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Records returned", permits.length.toLocaleString()],
            ["With issue dates", issuedCount.toLocaleString()],
            ["Combined reported cost", formatMoney(totalCost)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-2xl font-bold">
                {loading ? "..." : value}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Matching permit records
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {refreshedAt
                  ? `Retrieved ${new Date(refreshedAt).toLocaleString()}`
                  : "City of Chicago Open Data"}
              </p>
            </div>

            <button
              type="button"
              disabled={loading || Boolean(error) || permits.length === 0}
              onClick={() => exportCSV(permits)}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-40"
            >
              Export CSV
            </button>
          </div>

          {limited && !loading && (
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Showing the newest 500 matching records.
              Narrow your search for more targeted results.
              CSV export includes only these records.
            </p>
          )}

          {loading ? (
            <p className="py-10 text-center text-gray-500">
              Loading Chicago permit records...
            </p>
          ) : error ? (
            <p className="py-8 text-gray-500">
              Results are unavailable until the request succeeds.
            </p>
          ) : permits.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              No permits matched your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    {[
                      "Application",
                      "Address",
                      "Community area",
                      "Permit type",
                      "Issue date",
                      "Reported cost",
                      "Description",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-3 py-3 font-semibold"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permits.map((p, index) => (
                    <tr
                      key={`${p.permitNumber}-${index}`}
                      className="border-b align-top hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-3 py-4">
                        {formatDate(p.applicationStartDate)}
                      </td>
                      <td className="min-w-44 px-3 py-4 font-medium">
                        {p.address || "—"}
                        <div className="mt-1 text-xs text-gray-500">
                          {p.permitNumber}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {AREAS[Number(p.communityArea) - 1] ||
                          "Unknown"}
                      </td>
                      <td className="min-w-40 px-3 py-4">
                        {p.permitType || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        {formatDate(p.issueDate)}
                        <div className="mt-1 text-xs text-gray-500">
                          {p.permitStatus}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        {formatMoney(p.reportedCost)}
                      </td>
                      <td className="min-w-72 max-w-lg px-3 py-4 text-gray-700">
                        {p.workDescription || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-5 text-xs text-gray-500">
          Source: City of Chicago Building Permits (ydr8-5enu).
          Work categories are keyword-based. Reported costs are not
          verified contract values. Permit records do not guarantee
          available sales opportunities.
        </p>
      </div>
    </main>
  )
}

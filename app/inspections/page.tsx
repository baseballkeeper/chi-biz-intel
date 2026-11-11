
"use client"

import { useEffect, useState } from "react"

type Inspection = {
  id: string
  businessName: string
  alternateName: string
  licenseNumber: string
  facilityType: string
  risk: string
  address: string
  city: string
  state: string
  zipCode: string
  date: string
  inspectionType: string
  result: string
  violations: string
  latitude: string
  longitude: string
}

type ApiResponse = {
  count?: number
  refreshedAt?: string
  inspections?: Inspection[]
  error?: string
  details?: string
}

const results = [
  { value: "all", label: "All results" },
  { value: "Pass", label: "Pass" },
  { value: "Pass w/ Conditions", label: "Pass with conditions" },
  { value: "Fail", label: "Fail" },
  { value: "Out of Business", label: "Out of business" },
  { value: "No Entry", label: "No entry" },
  { value: "Not Ready", label: "Not ready" },
  { value: "Business Not Located", label: "Business not located" },
]

const facilities = [
  { value: "all", label: "All facility types" },
  { value: "restaurant", label: "Restaurants" },
  { value: "grocery", label: "Grocery stores" },
  { value: "school", label: "Schools" },
]

const dateRanges = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 180 days" },
  { value: "365", label: "Last 365 days" },
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

function csvCell(value: string) {
  let text = value

  // Prevent spreadsheet applications from interpreting
  // untrusted public data as formulas.
  if (/^\s*[=+\-@]/.test(text)) {
    text = "'" + text
  }

  return `"${text.replace(/"/g, '""')}"`
}

function downloadCSV(inspections: Inspection[]) {
  const headers = [
    "Inspection Date",
    "Business Name",
    "Address",
    "City",
    "State",
    "ZIP Code",
    "Facility Type",
    "Risk",
    "Inspection Type",
    "Result",
    "Violations",
    "License Number",
    "Inspection ID",
  ]

  const rows = inspections.map((inspection) => [
    inspection.date,
    inspection.businessName,
    inspection.address,
    inspection.city,
    inspection.state,
    inspection.zipCode,
    inspection.facilityType,
    inspection.risk,
    inspection.inspectionType,
    inspection.result,
    inspection.violations,
    inspection.licenseNumber,
    inspection.id,
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
  link.download = `chicago-food-inspections-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`

  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function resultClasses(result: string) {
  if (result === "Pass") {
    return "bg-green-100 text-green-800"
  }

  if (result === "Pass w/ Conditions") {
    return "bg-amber-100 text-amber-800"
  }

  if (result === "Fail") {
    return "bg-red-100 text-red-800"
  }

  return "bg-gray-100 text-gray-700"
}

function splitViolations(value: string) {
  if (!value.trim()) return []

  return value
    .split(/\s*\|\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState("")

  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [result, setResult] = useState("all")
  const [facility, setFacility] = useState("all")
  const [days, setDays] = useState("90")

  const [expandedId, setExpandedId] = useState<string | null>(
    null
  )

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()

      if (appliedSearch) {
        params.set("search", appliedSearch)
      }

      if (result !== "all") {
        params.set("result", result)
      }

      if (facility !== "all") {
        params.set("facility", facility)
      }

      params.set("days", days)

      try {
        const response = await fetch(
          `/api/inspections?${params.toString()}`,
          { signal: controller.signal }
        )

        const data = (await response.json()) as ApiResponse

        if (!response.ok) {
          throw new Error(
            [data.error, data.details]
              .filter(Boolean)
              .join(": ") || "Unable to load inspections"
          )
        }

        if (!controller.signal.aborted) {
          setInspections(data.inspections || [])
          setRefreshedAt(data.refreshedAt || "")
          setExpandedId(null)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : String(err)
          )
          setInspections([])
          setRefreshedAt("")
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => controller.abort()
  }, [appliedSearch, result, facility, days])

  const passCount = inspections.filter(
    (inspection) => inspection.result === "Pass"
  ).length

  const failCount = inspections.filter(
    (inspection) => inspection.result === "Fail"
  ).length

  const conditionsCount = inspections.filter(
    (inspection) =>
      inspection.result === "Pass w/ Conditions"
  ).length

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"

  function clearFilters() {
    setSearch("")
    setAppliedSearch("")
    setResult("all")
    setFacility("all")
    setDays("90")
  }

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
            Food Inspection Activity
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            Explore Chicago food inspection results,
            facility risk classifications, and documented
            inspection findings.
          </p>
        </header>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Search food inspections
          </h2>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              setAppliedSearch(search.trim())
            }}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm font-medium">
                Business, address, or keyword
                <input
                  className={inputClass}
                  placeholder="Pizza, Kedzie, mice..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </label>

              <label className="block text-sm font-medium">
                Inspection result
                <select
                  className={inputClass}
                  value={result}
                  onChange={(event) =>
                    setResult(event.target.value)
                  }
                >
                  {results.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Facility type
                <select
                  className={inputClass}
                  value={facility}
                  onChange={(event) =>
                    setFacility(event.target.value)
                  }
                >
                  {facilities.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Date range
                <select
                  className={inputClass}
                  value={days}
                  onChange={(event) =>
                    setDays(event.target.value)
                  }
                >
                  {dateRanges.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Search
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
              >
                Clear filters
              </button>
            </div>
          </form>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Inspections loaded
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : inspections.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Passed
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : passCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Passed with conditions
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : conditionsCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Failed
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : failCount}
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Recent food inspections
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {refreshedAt
                  ? `Retrieved ${new Date(
                      refreshedAt
                    ).toLocaleString()}`
                  : "City of Chicago Open Data"}
              </p>
            </div>

            <button
              type="button"
              disabled={loading || inspections.length === 0}
              onClick={() => downloadCSV(inspections)}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-40"
            >
              Export CSV
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <p className="py-10 text-center text-gray-500">
              Loading food inspections...
            </p>
          ) : inspections.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              No inspections found for these filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    {[
                      "Date",
                      "Business",
                      "Address",
                      "Facility",
                      "Result",
                      "Inspection",
                      "Findings",
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
                  {inspections.map((inspection) => (
                    <tr
                      key={inspection.id}
                      className="border-b align-top hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-3 py-4">
                        {formatDate(inspection.date)}
                      </td>

                      <td className="min-w-48 px-3 py-4">
                        <div className="font-semibold">
                          {inspection.businessName}
                        </div>

                        {inspection.alternateName &&
                          inspection.alternateName !==
                            inspection.businessName && (
                            <div className="mt-1 text-xs text-gray-500">
                              {inspection.alternateName}
                            </div>
                          )}
                      </td>

                      <td className="min-w-44 px-3 py-4">
                        {inspection.address || "—"}

                        {inspection.zipCode && (
                          <div className="mt-1 text-xs text-gray-500">
                            Chicago, IL {inspection.zipCode}
                          </div>
                        )}
                      </td>

                      <td className="min-w-36 px-3 py-4">
                        <div>
                          {inspection.facilityType || "—"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {inspection.risk}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${resultClasses(
                            inspection.result
                          )}`}
                        >
                          {inspection.result || "Unknown"}
                        </span>
                      </td>

                      <td className="min-w-36 px-3 py-4">
                        {inspection.inspectionType || "—"}
                      </td>

                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expandedId === inspection.id
                                ? null
                                : inspection.id
                            )
                          }
                          className="whitespace-nowrap text-sm font-semibold text-blue-700 hover:underline"
                        >
                          {expandedId === inspection.id
                            ? "Hide findings"
                            : "View findings"}
                        </button>

                        {expandedId === inspection.id && (
                          <div className="mt-3 min-w-64 max-w-lg rounded-lg bg-gray-50 p-4 text-xs leading-6">
                            <p className="font-semibold">
                              Inspection findings
                            </p>

                            {splitViolations(
                              inspection.violations
                            ).length === 0 ? (
                              <p className="mt-2 text-gray-600">
                                No violations listed in this
                                record.
                              </p>
                            ) : (
                              <ul className="mt-3 space-y-3">
                                {splitViolations(
                                  inspection.violations
                                ).map((item, index) => (
                                  <li
                                    key={index}
                                    className="border-b border-gray-200 pb-3 last:border-0"
                                  >
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="mt-3 border-t border-gray-200 pt-3 text-gray-500">
                              Inspection ID: {inspection.id}
                              <br />
                              License:{" "}
                              {inspection.licenseNumber || "—"}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-5 text-xs leading-6 text-gray-500">
          Source: City of Chicago Food Inspections
          (4ijn-s7e5). Results are limited to the 200 most
          recent matching inspections within the selected
          date range. A passing inspection may still have
          documented violations. Inspection results reflect
          findings at the time of inspection and should not
          be treated as a current assessment of a facility.
        </p>
      </div>
    </main>
  )
}

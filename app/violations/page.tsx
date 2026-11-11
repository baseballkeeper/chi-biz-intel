
"use client"

import { useEffect, useMemo, useState } from "react"

type Violation = {
  id: string
  date: string
  lastModified: string
  code: string
  status: string
  description: string
  inspectorComments: string
  ordinance: string
  location: string
  inspectionNumber: string
  inspectionStatus: string
  inspectionCategory: string
  department: string
  address: string
  propertyGroup: string
  latitude: string
  longitude: string
}

type ApiResponse = {
  count?: number
  refreshedAt?: string
  violations?: Violation[]
  error?: string
  details?: string
}

const statuses = [
  { value: "all", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "COMPLIED", label: "Complied" },
  { value: "CLOSED", label: "Closed" },
]

const categories = [
  { value: "all", label: "All inspection categories" },
  { value: "PERMIT", label: "Permit" },
  { value: "COMPLAINT", label: "Complaint" },
  { value: "PERIODIC", label: "Periodic" },
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

  // Prevent spreadsheet formula injection.
  if (/^\s*[=+\-@]/.test(text)) {
    text = "'" + text
  }

  return `"${text.replace(/"/g, '""')}"`
}

function downloadCSV(violations: Violation[]) {
  const headers = [
    "Violation Date",
    "Address",
    "Status",
    "Violation Code",
    "Description",
    "Inspector Comments",
    "Department",
    "Inspection Category",
    "Inspection Status",
    "Inspection Number",
    "Ordinance",
    "Violation ID",
  ]

  const rows = violations.map((v) => [
    v.date,
    v.address,
    v.status,
    v.code,
    v.description,
    v.inspectorComments,
    v.department,
    v.inspectionCategory,
    v.inspectionStatus,
    v.inspectionNumber,
    v.ordinance,
    v.id,
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
  link.download = `chicago-building-violations-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`

  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState("")

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [category, setCategory] = useState("all")
  const [department, setDepartment] = useState("all")

  const [expandedId, setExpandedId] = useState<string | null>(
    null
  )

  // Keep the typed search separate from the API search
  // so we don't request data on every keystroke.
  const [appliedSearch, setAppliedSearch] = useState("")

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()

      if (status !== "all") {
        params.set("status", status)
      }

      if (category !== "all") {
        params.set("category", category)
      }

      if (department !== "all") {
        params.set("department", department)
      }

      if (appliedSearch) {
        params.set("search", appliedSearch)
      }

      try {
        const response = await fetch(
          `/api/violations?${params.toString()}`,
          { signal: controller.signal }
        )

        const data = (await response.json()) as ApiResponse

        if (!response.ok) {
          throw new Error(
            [data.error, data.details]
              .filter(Boolean)
              .join(": ") || "Unable to load violations"
          )
        }

        if (!controller.signal.aborted) {
          setViolations(data.violations || [])
          setRefreshedAt(data.refreshedAt || "")
          setExpandedId(null)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : String(err)
          )
          setViolations([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => controller.abort()
  }, [status, category, department, appliedSearch])

  const departments = useMemo(
    () =>
      [...new Set(
        violations.map((v) => v.department).filter(Boolean)
      )].sort(),
    [violations]
  )

  const openCount = violations.filter(
    (v) => v.status === "OPEN"
  ).length

  const failedCount = violations.filter(
    (v) => v.inspectionStatus === "FAILED"
  ).length

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"

  function clearFilters() {
    setSearch("")
    setAppliedSearch("")
    setStatus("all")
    setCategory("all")
    setDepartment("all")
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
            Building Violations
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            Explore reported building code violations,
            inspection findings, and property maintenance
            issues across Chicago.
          </p>
        </header>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Search violations
          </h2>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              setAppliedSearch(search.trim())
            }}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm font-medium">
                Address or keyword
                <input
                  className={`mt-1 ${inputClass}`}
                  placeholder="Wabash, elevator, window..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </label>

              <label className="block text-sm font-medium">
                Violation status
                <select
                  className={`mt-1 ${inputClass}`}
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                >
                  {statuses.map((item) => (
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
                Inspection category
                <select
                  className={`mt-1 ${inputClass}`}
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                >
                  {categories.map((item) => (
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
                Department
                <select
                  className={`mt-1 ${inputClass}`}
                  value={department}
                  onChange={(event) =>
                    setDepartment(event.target.value)
                  }
                >
                  <option value="all">
                    All departments
                  </option>

                  {departments.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}

                  {department !== "all" &&
                    !departments.includes(department) && (
                      <option value={department}>
                        {department}
                      </option>
                    )}
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

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Records loaded
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : violations.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Open violations in results
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : openCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Failed inspections in results
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : failedCount}
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Recent violations
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
              disabled={loading || violations.length === 0}
              onClick={() => downloadCSV(violations)}
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
              Loading building violations...
            </p>
          ) : violations.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              No violations found for these filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    {[
                      "Date",
                      "Address",
                      "Status",
                      "Violation",
                      "Department",
                      "Inspection",
                      "Details",
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
                  {violations.map((violation) => (
                    <tr
                      key={violation.id}
                      className="border-b align-top hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-3 py-4">
                        {formatDate(violation.date)}
                      </td>

                      <td className="min-w-44 px-3 py-4 font-medium">
                        {violation.address || "—"}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                            violation.status === "OPEN"
                              ? "bg-red-100 text-red-800"
                              : violation.status === "COMPLIED"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {violation.status || "Unknown"}
                        </span>
                      </td>

                      <td className="min-w-56 px-3 py-4">
                        <div className="font-medium">
                          {violation.description || "—"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {violation.code}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        {violation.department || "—"}
                      </td>

                      <td className="px-3 py-4">
                        <div>
                          {violation.inspectionCategory || "—"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {violation.inspectionStatus}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expandedId === violation.id
                                ? null
                                : violation.id
                            )
                          }
                          className="text-sm font-semibold text-blue-700 hover:underline"
                        >
                          {expandedId === violation.id
                            ? "Hide details"
                            : "View details"}
                        </button>

                        {expandedId === violation.id && (
                          <div className="mt-3 min-w-64 max-w-md space-y-3 rounded-lg bg-gray-50 p-3 text-xs leading-6">
                            <div>
                              <strong>Inspector comments:</strong>
                              <p>
                                {violation.inspectorComments ||
                                  "No comments provided."}
                              </p>
                            </div>

                            <div>
                              <strong>Ordinance:</strong>
                              <p>
                                {violation.ordinance || "—"}
                              </p>
                            </div>

                            <div>
                              <strong>Inspection number:</strong>
                              <p>
                                {violation.inspectionNumber || "—"}
                              </p>
                            </div>

                            <div>
                              <strong>Violation ID:</strong>
                              <p>{violation.id}</p>
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
          Source: City of Chicago Building Violations
          (22u3-xenr). Results are limited to the 200 most
          recent matching records. Statuses reflect city
          records and may not represent current property
          conditions. Verify important findings against
          official records.
        </p>
      </div>
    </main>
  )
}

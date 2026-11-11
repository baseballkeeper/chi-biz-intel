
"use client"

import { useEffect, useMemo, useState } from "react"

type Business = {
  licenseId: string
  licenseNumber: string
  businessName: string
  legalName: string
  address: string
  zipCode: string
  communityArea: string
  licenseType: string
  businessActivity: string
  applicationType: string
  dateIssued: string
  licenseStartDate: string
  licenseStatus: string
}

type ApiResponse = {
  count: number
  refreshedAt: string
  businesses: Business[]
  error?: string
  details?: string
}

function formatDate(value: string) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

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
  // untrusted city data as formulas.
  if (/^\s*[=+\-@]/.test(text)) {
    text = "'" + text
  }

  return `"${text.replace(/"/g, '""')}"`
}

function downloadCSV(businesses: Business[]) {
  const headers = [
    "Business Name",
    "Legal Name",
    "Address",
    "ZIP Code",
    "Community Area",
    "License Type",
    "Business Activity",
    "Date Issued",
    "License Start Date",
    "License Number",
  ]

  const rows = businesses.map((business) => [
    business.businessName,
    business.legalName,
    business.address,
    business.zipCode,
    business.communityArea,
    business.licenseType,
    business.businessActivity,
    business.dateIssued,
    business.licenseStartDate,
    business.licenseNumber,
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
  link.download = `chicago-new-businesses-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`

  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState("")

  const [search, setSearch] = useState("")
  const [area, setArea] = useState("all")
  const [licenseType, setLicenseType] = useState("all")

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const response = await fetch("/api/businesses", {
          signal: controller.signal,
        })

        const data = (await response.json()) as ApiResponse

        if (!response.ok) {
          throw new Error(
            [data.error, data.details]
              .filter(Boolean)
              .join(": ") || "Unable to load businesses"
          )
        }

        if (!controller.signal.aborted) {
          setBusinesses(data.businesses || [])
          setRefreshedAt(data.refreshedAt || "")
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : String(err)
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => controller.abort()
  }, [])

  const areas = useMemo(
    () =>
      [...new Set(
        businesses.map((b) => b.communityArea).filter(Boolean)
      )].sort(),
    [businesses]
  )

  const licenseTypes = useMemo(
    () =>
      [...new Set(
        businesses.map((b) => b.licenseType).filter(Boolean)
      )].sort(),
    [businesses]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return businesses.filter((business) => {
      const matchesSearch =
        !term ||
        [
          business.businessName,
          business.legalName,
          business.address,
          business.zipCode,
          business.businessActivity,
          business.licenseType,
        ].some((value) => value.toLowerCase().includes(term))

      const matchesArea =
        area === "all" || business.communityArea === area

      const matchesLicense =
        licenseType === "all" ||
        business.licenseType === licenseType

      return matchesSearch && matchesArea && matchesLicense
    })
  }, [businesses, search, area, licenseType])

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"

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
            New Business Activity
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            Explore recently issued initial business licenses
            across Chicago. Discover business names, locations,
            activities, and license types.
          </p>
        </header>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Search businesses
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium">
              Business name, address, or keyword
              <input
                className={`mt-1 ${inputClass}`}
                placeholder="Restaurant, salon, Michigan..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </label>

            <label className="block text-sm font-medium">
              Community area
              <select
                className={`mt-1 ${inputClass}`}
                value={area}
                onChange={(event) =>
                  setArea(event.target.value)
                }
              >
                <option value="all">All areas</option>
                {areas.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              License type
              <select
                className={`mt-1 ${inputClass}`}
                value={licenseType}
                onChange={(event) =>
                  setLicenseType(event.target.value)
                }
              >
                <option value="all">All license types</option>
                {licenseTypes.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearch("")
              setArea("all")
              setLicenseType("all")
            }}
            className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
          >
            Clear filters
          </button>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Licenses loaded
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : businesses.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Matching records
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : filtered.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Areas represented
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : areas.length}
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Recently issued licenses
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
              disabled={loading || filtered.length === 0}
              onClick={() => downloadCSV(filtered)}
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
              Loading Chicago business licenses...
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              No businesses matched your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    {[
                      "Date issued",
                      "Business",
                      "Address",
                      "Community area",
                      "License type",
                      "Business activity",
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
                  {filtered.map((business, index) => (
                    <tr
                      key={`${business.licenseId}-${index}`}
                      className="border-b align-top hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-3 py-4">
                        {formatDate(business.dateIssued)}
                      </td>

                      <td className="min-w-48 px-3 py-4">
                        <div className="font-semibold">
                          {business.businessName}
                        </div>

                        {business.legalName &&
                          business.legalName !==
                            business.businessName && (
                            <div className="mt-1 text-xs text-gray-500">
                              {business.legalName}
                            </div>
                          )}
                      </td>

                      <td className="min-w-48 px-3 py-4">
                        {business.address || "—"}
                        {business.zipCode && (
                          <div className="mt-1 text-xs text-gray-500">
                            Chicago, IL {business.zipCode}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4">
                        {business.communityArea || "—"}
                      </td>

                      <td className="min-w-40 px-3 py-4">
                        {business.licenseType || "—"}
                      </td>

                      <td className="min-w-64 px-3 py-4 text-gray-700">
                        {business.businessActivity || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-5 text-xs text-gray-500">
          Source: City of Chicago Business Licenses — Current
          Active (uupf-x98q). This page displays up to 100
          recently issued initial licenses. An initial license
          does not necessarily mean a new storefront or
          newly established business.
        </p>
      </div>
    </main>
  )
}


"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getCommunityAreaName } from "@/lib/chicago-community-areas"

type Activity = {
  id: string
  type: "permit" | "business_license"
  eventType: "application_submitted" | "license_issued"
  date: string
  title: string
  description: string
  address: string
  communityArea: string
  status: string
  referenceNumber: string
  reportedCost: number | null
  sourceUrl: string
}

type ActivityResponse = {
  count: number
  refreshedAt: string
  limited: {
    permits: boolean
    businesses: boolean
  }
  activities: Activity[]
}

type Filter = "all" | "permit" | "business_license"

function formatDate(value: string): string {
  if (!value) return "Date unavailable"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable"
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function formatCost(value: number | null): string {
  if (value === null) return "Not reported"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function readableText(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) return ""

  if (trimmed !== trimmed.toUpperCase()) {
    return trimmed
  }

  return trimmed
    .toLowerCase()
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, letter) => {
      return prefix + letter.toUpperCase()
    })
    .replace(/\b(hvac|ev|il|sq|ft|amp|kwh)\b/gi, (match) => {
      return match.toUpperCase()
    })
}

function permitCategory(description: string): string {
  const text = description.toUpperCase()

  if (text.includes("DEMOLITION") || text.includes("WRECKING")) {
    return "Demolition"
  }

  if (text.includes("ROOF")) {
    return "Roofing"
  }

  if (
    text.includes("ELECTRICAL") ||
    text.includes("CIRCUIT") ||
    text.includes("VOLTAGE")
  ) {
    return "Electrical"
  }

  if (
    text.includes("PLUMBING") ||
    text.includes("WATER HEATER")
  ) {
    return "Plumbing"
  }

  if (
    text.includes("HVAC") ||
    text.includes("FURNACE") ||
    text.includes("AIR CONDITION")
  ) {
    return "HVAC"
  }

  if (
    text.includes("RENOVATION") ||
    text.includes("ALTERATION") ||
    text.includes("REMODEL") ||
    text.includes("REHAB")
  ) {
    return "Renovation"
  }

  if (
    text.includes("TUCKPOINTING") ||
    text.includes("MASONRY")
  ) {
    return "Masonry"
  }

  if (text.includes("FENCE")) {
    return "Fencing"
  }

  if (text.includes("GARAGE")) {
    return "Garage"
  }

  if (text.includes("FIRE ALARM")) {
    return "Fire safety"
  }

  return "Other permit"
}

function activityLabel(activity: Activity): string {
  return activity.eventType === "license_issued"
    ? "Business license issued"
    : "Permit application submitted"
}

function activityTitle(activity: Activity): string {
  if (activity.type === "business_license") {
    return activity.title
  }

  return permitCategory(activity.description)
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshedAt, setRefreshedAt] = useState("")
  const [limited, setLimited] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadActivities() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch("/api/activity", {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Unable to load activity records.")
        }

        const data =
          (await response.json()) as ActivityResponse

        if (!Array.isArray(data.activities)) {
          throw new Error("Unexpected activity response.")
        }

        setActivities(data.activities)
        setRefreshedAt(data.refreshedAt || "")
        setLimited(
          Boolean(
            data.limited?.permits ||
              data.limited?.businesses
          )
        )
      } catch (err) {
        if (controller.signal.aborted) return

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load activity records."
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadActivities()

    return () => controller.abort()
  }, [])

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase()

    return activities.filter((activity) => {
      if (filter !== "all" && activity.type !== filter) {
        return false
      }

      if (!query) return true

      const searchable = [
        activity.title,
        activity.description,
        activity.address,
        activity.communityArea,
        getCommunityAreaName(activity.communityArea),
        activity.referenceNumber,
      ]
        .join(" ")
        .toLowerCase()

      return searchable.includes(query)
    })
  }, [activities, filter, search])

  const permitCount = activities.filter(
    (activity) => activity.type === "permit"
  ).length

  const licenseCount = activities.filter(
    (activity) => activity.type === "business_license"
  ).length

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Back to home
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Chicago Public Data
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Commercial Activity Feed
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Explore recent building permit applications and
            business-license issuances across Chicago.
            Discover what is being proposed, where activity is
            occurring, and which businesses are receiving licenses.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Records loaded
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {activities.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Permits in sample
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {permitCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Licenses in sample
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {licenseCount}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All activity"],
                ["permit", "Building permits"],
                ["business_license", "Business licenses"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filter === value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search addresses, neighborhoods, businesses..."
            aria-label="Search activity records"
            className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600"
          />

          <p className="mt-3 text-xs text-slate-500">
            Showing {filteredActivities.length} of{" "}
            {activities.length} loaded records
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading Chicago activity...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-700">
            {error}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No matching activity records.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((activity) => {
              const expanded = expandedId === activity.id
              const isPermit = activity.type === "permit"
              const areaName = getCommunityAreaName(
                activity.communityArea
              )

              return (
                <article
                  key={activity.id}
                  className="p-5 transition hover:bg-slate-50"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(
                        expanded ? null : activity.id
                      )
                    }
                    aria-expanded={expanded}
                    className="w-full text-left"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                          isPermit
                            ? "bg-blue-50 text-blue-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {activityLabel(activity)}
                      </span>

                      <span className="text-xs text-slate-500">
                        {formatDate(activity.date)}
                      </span>
                    </div>

                    <h2 className="mt-3 text-lg font-semibold text-slate-900">
                      {activityTitle(activity)}
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {activity.address || "Address unavailable"}
                      {areaName ? ` · ${areaName}` : ""}
                    </p>

                    {activity.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {readableText(activity.description)}
                      </p>
                    )}

                    <p className="mt-3 text-xs font-semibold text-blue-700">
                      {expanded ? "Hide details −" : "View details +"}
                    </p>
                  </button>

                  {expanded && (
                    <div className="mt-5 rounded-lg bg-slate-100 p-4">
                      <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-slate-500">
                            Activity type
                          </dt>
                          <dd className="mt-1 font-medium text-slate-900">
                            {activityLabel(activity)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-slate-500">
                            Reference number
                          </dt>
                          <dd className="mt-1 font-medium text-slate-900">
                            {activity.referenceNumber || "Unavailable"}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-slate-500">
                            Reported status
                          </dt>
                          <dd className="mt-1 font-medium text-slate-900">
                            {activity.status || "Not reported"}
                          </dd>
                        </div>

                        {isPermit && (
                          <div>
                            <dt className="text-slate-500">
                              Reported project cost
                            </dt>
                            <dd className="mt-1 font-medium text-slate-900">
                              {formatCost(activity.reportedCost)}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {activity.description && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-900">
                            Original record description
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {activity.description}
                          </p>
                        </div>
                      )}

                      <a
                        href={activity.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
                      >
                        View source dataset ↗
                      </a>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <div className="mt-6 space-y-2 text-xs leading-5 text-slate-500">
        {refreshedAt && (
          <p>
            API response generated: {formatDate(refreshedAt)}
          </p>
        )}

        {limited && (
          <p>
            This feed displays a limited sample of recent records.
            It is not a complete inventory of Chicago activity.
          </p>
        )}

        <p>
          Building permit applications do not establish that
          construction has begun or been completed. Business-license
          issuance does not establish that a business has opened.
          Records are provided by the City of Chicago.
        </p>
      </div>
    </main>
  )
}

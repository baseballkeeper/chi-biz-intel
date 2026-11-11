
import { NextResponse } from "next/server"

const DATASET = "ydr8-5enu"
const BASE_URL = `https://data.cityofchicago.org/resource/${DATASET}.json`

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  roofing: ["ROOF", "SHINGLE"],
  hvac: ["HVAC", "FURNACE", "AIR CONDITION", "DUCTWORK"],
  electrical: ["ELECTRIC", "WIRING", "LIGHTING"],
  plumbing: ["PLUMB", "SEWER", "WATER HEATER"],
  renovation: ["RENOVAT", "REMODEL", "ALTERATION", "REHAB"],
  demolition: ["DEMOLITION", "WRECKING", "DEMOLISH"],
  signs: ["SIGNAGE", "SIGN PERMIT", "SIGN INSTALL"],
}

type RawPermit = Record<string, string | undefined>

function escapeSoql(value: string): string {
  return value.replace(/'/g, "''")
}

function keywordFilter(keyword: string): string {
  const safe = escapeSoql(keyword.toUpperCase())

  return `(
    upper(work_description) like '%${safe}%'
    OR upper(permit_type) like '%${safe}%'
  )`.replace(/\s+/g, " ")
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams

  const search = (params.get("search") || "").trim().slice(0, 80)
  const category = params.get("category") || "all"
  const status = params.get("status") || "all"
  const area = params.get("area") || "all"
  const days = Number(params.get("days") || 30)
  const minCost = Number(params.get("minCost") || 0)

  if (
    (category !== "all" &&
      !Object.prototype.hasOwnProperty.call(
        CATEGORY_KEYWORDS,
        category
      )) ||
    !["all", "issued", "pending"].includes(status) ||
    (area !== "all" &&
      (!/^\d+$/.test(area) ||
        Number(area) < 1 ||
        Number(area) > 77)) ||
    ![7, 30, 90, 180, 365].includes(days) ||
    !Number.isFinite(minCost) ||
    minCost < 0 ||
    minCost > 1000000000
  ) {
    return NextResponse.json(
      { error: "Invalid filter parameters" },
      { status: 400 }
    )
  }

  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - days)

  const cutoffDate = cutoff.toISOString().slice(0, 10)

  const filters: string[] = [
    `application_start_date >= '${cutoffDate}T00:00:00'`,
  ]

  if (search) {
    const safe = escapeSoql(search.toUpperCase())

    filters.push(`(
      upper(work_description) like '%${safe}%'
      OR upper(street_name) like '%${safe}%'
      OR upper(permit_type) like '%${safe}%'
    )`.replace(/\s+/g, " "))
  }

  if (category !== "all") {
    const expressions = CATEGORY_KEYWORDS[category].map(
      keywordFilter
    )

    filters.push(`(${expressions.join(" OR ")})`)
  }

  if (status === "issued") {
    filters.push("issue_date IS NOT NULL")
  }

  if (status === "pending") {
    filters.push("issue_date IS NULL")
  }

  if (area !== "all") {
    filters.push(`community_area = '${area}'`)
  }

  if (minCost > 0) {
    filters.push(`reported_cost >= ${minCost}`)
  }

  const soql = `
    SELECT
      permit_,
      permit_type,
      permit_status,
      permit_milestone,
      review_type,
      application_start_date,
      issue_date,
      street_number,
      street_direction,
      street_name,
      work_description,
      reported_cost,
      community_area,
      latitude,
      longitude
    WHERE ${filters.join(" AND ")}
    ORDER BY application_start_date DESC
    LIMIT 500
  `.trim().replace(/\s+/g, " ")

  const url = `${BASE_URL}?$query=${encodeURIComponent(soql)}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 900 },
      headers: {
        "User-Agent": "chi-biz-intel/1.0",
      },
    })

    if (!response.ok) {
      const details = await response.text()

      return NextResponse.json(
        {
          error: "Chicago Open Data request failed",
          status: response.status,
          details: details.slice(0, 1200),
        },
        { status: 502 }
      )
    }

    const rows = (await response.json()) as RawPermit[]

    const permits = rows.map((row) => {
      const address = [
        row.street_number,
        row.street_direction,
        row.street_name,
      ].filter(Boolean).join(" ")

      const cost = row.reported_cost
        ? Number(row.reported_cost)
        : null

      const lat =
        row.latitude !== undefined
          ? Number(row.latitude)
          : null

      const lon =
        row.longitude !== undefined
          ? Number(row.longitude)
          : null

      return {
        permitNumber: row.permit_ || "",
        permitType: row.permit_type || "",
        permitStatus: row.permit_status || "",
        permitMilestone: row.permit_milestone || "",
        reviewType: row.review_type || "",
        applicationStartDate: row.application_start_date || "",
        issueDate: row.issue_date || "",
        address,
        workDescription: row.work_description || "",
        reportedCost:
          cost !== null && Number.isFinite(cost)
            ? cost
            : null,
        communityArea: row.community_area || "",
        latitude:
          lat !== null && Number.isFinite(lat)
            ? lat
            : null,
        longitude:
          lon !== null && Number.isFinite(lon)
            ? lon
            : null,
      }
    })

    return NextResponse.json({
      source: { dataset: DATASET },
      refreshedAt: new Date().toISOString(),
      count: permits.length,
      limited: permits.length === 500,
      permits,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Server error",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    )
  }
}

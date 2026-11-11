
import { NextRequest, NextResponse } from "next/server"

const DATASET = "4ijn-s7e5"

const BASE_URL =
  `https://data.cityofchicago.org/resource/${DATASET}.json`

type RawInspection = {
  inspection_id?: string
  dba_name?: string
  aka_name?: string
  license_?: string
  facility_type?: string
  risk?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  inspection_date?: string
  inspection_type?: string
  results?: string
  violations?: string
  latitude?: string
  longitude?: string
}

function escapeSoql(value: string) {
  return value.replace(/'/g, "''")
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const search = (params.get("search") || "").trim()
  const result = params.get("result") || "all"
  const facility = params.get("facility") || "all"
  const days = params.get("days") || "90"

  const conditions: string[] = [
    "inspection_date IS NOT NULL",
  ]

  const allowedResults = [
    "Pass",
    "Fail",
    "Pass w/ Conditions",
    "Out of Business",
    "No Entry",
    "Not Ready",
    "Business Not Located",
  ]

  if (allowedResults.includes(result)) {
    conditions.push(
      `results = '${escapeSoql(result)}'`
    )
  }

  if (facility === "restaurant") {
    conditions.push(
      "upper(facility_type) LIKE '%RESTAURANT%'"
    )
  } else if (facility === "grocery") {
    conditions.push(
      "upper(facility_type) LIKE '%GROCERY%'"
    )
  } else if (facility === "school") {
    conditions.push(
      "upper(facility_type) LIKE '%SCHOOL%'"
    )
  }

  const allowedDays = [7, 30, 90, 180, 365]
  const parsedDays = Number(days)

  if (allowedDays.includes(parsedDays)) {
    const cutoff = new Date()
    cutoff.setUTCDate(cutoff.getUTCDate() - parsedDays)

    const date = cutoff.toISOString().slice(0, 10)

    conditions.push(
      `inspection_date >= '${date}T00:00:00'`
    )
  }

  if (search && search.length <= 100) {
    const safeSearch = escapeSoql(search.toUpperCase())

    conditions.push(
      `(` +
        `upper(dba_name) LIKE '%${safeSearch}%' ` +
        `OR upper(address) LIKE '%${safeSearch}%' ` +
        `OR upper(violations) LIKE '%${safeSearch}%'` +
      `)`
    )
  }

  const soql = `
    SELECT
      inspection_id,
      dba_name,
      aka_name,
      license_,
      facility_type,
      risk,
      address,
      city,
      state,
      zip,
      inspection_date,
      inspection_type,
      results,
      violations,
      latitude,
      longitude
    WHERE ${conditions.join(" AND ")}
    ORDER BY inspection_date DESC, inspection_id DESC
    LIMIT 200
  `.trim().replace(/\s+/g, " ")

  const url =
    `${BASE_URL}?$query=${encodeURIComponent(soql)}`

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
          details: details.slice(0, 1500),
        },
        { status: 502 }
      )
    }

    const rows = (await response.json()) as RawInspection[]

    const inspections = rows.map((row) => ({
      id: row.inspection_id || "",
      businessName:
        row.dba_name || row.aka_name || "Unknown",
      alternateName: row.aka_name || "",
      licenseNumber: row.license_ || "",
      facilityType: row.facility_type || "",
      risk: row.risk || "",
      address: row.address || "",
      city: row.city || "",
      state: row.state || "",
      zipCode: row.zip || "",
      date: row.inspection_date || "",
      inspectionType: row.inspection_type || "",
      result: row.results || "",
      violations: row.violations || "",
      latitude: row.latitude || "",
      longitude: row.longitude || "",
    }))

    return NextResponse.json({
      source: {
        dataset: DATASET,
        name: "Chicago Food Inspections",
      },
      refreshedAt: new Date().toISOString(),
      count: inspections.length,
      inspections,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to retrieve food inspections",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    )
  }
}

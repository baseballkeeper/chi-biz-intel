
import { NextRequest, NextResponse } from "next/server"

const DATASET = "22u3-xenr"

const BASE_URL =
  `https://data.cityofchicago.org/resource/${DATASET}.json`

type RawViolation = {
  id?: string
  violation_date?: string
  violation_last_modified_date?: string
  violation_code?: string
  violation_status?: string
  violation_description?: string
  violation_inspector_comments?: string
  violation_ordinance?: string
  violation_location?: string
  inspection_number?: string
  inspection_status?: string
  inspection_category?: string
  department_bureau?: string
  address?: string
  property_group?: string
  latitude?: string
  longitude?: string
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const status = params.get("status") || "all"
  const category = params.get("category") || "all"
  const department = params.get("department") || "all"
  const search = (params.get("search") || "").trim()

  const conditions: string[] = [
    "violation_date IS NOT NULL",
  ]

  // Restrict status and category to known values.
  const allowedStatuses = [
    "OPEN",
    "COMPLIED",
    "CLOSED",
  ]

  if (allowedStatuses.includes(status)) {
    conditions.push(`violation_status = '${status}'`)
  }

  const allowedCategories = [
    "PERMIT",
    "COMPLAINT",
    "PERIODIC",
  ]

  if (allowedCategories.includes(category)) {
    conditions.push(`inspection_category = '${category}'`)
  }

  // Escape single quotes for SoQL string literals.
  function escapeSoql(value: string) {
    return value.replace(/'/g, "''")
  }

  if (department !== "all" && department.length <= 80) {
    conditions.push(
      `department_bureau = '${escapeSoql(department)}'`
    )
  }

  if (search && search.length <= 100) {
    const safeSearch = escapeSoql(search.toUpperCase())

    conditions.push(
      `(upper(address) LIKE '%${safeSearch}%' ` +
      `OR upper(violation_description) LIKE '%${safeSearch}%' ` +
      `OR upper(violation_inspector_comments) LIKE '%${safeSearch}%')`
    )
  }

  const soql = `
    SELECT
      id,
      violation_date,
      violation_last_modified_date,
      violation_code,
      violation_status,
      violation_description,
      violation_inspector_comments,
      violation_ordinance,
      violation_location,
      inspection_number,
      inspection_status,
      inspection_category,
      department_bureau,
      address,
      property_group,
      latitude,
      longitude
    WHERE ${conditions.join(" AND ")}
    ORDER BY violation_date DESC, id DESC
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

    const rows = (await response.json()) as RawViolation[]

    const violations = rows.map((row) => ({
      id: row.id || "",
      date: row.violation_date || "",
      lastModified: row.violation_last_modified_date || "",
      code: row.violation_code || "",
      status: row.violation_status || "",
      description: row.violation_description || "",
      inspectorComments:
        row.violation_inspector_comments || "",
      ordinance: row.violation_ordinance || "",
      location: row.violation_location || "",
      inspectionNumber: row.inspection_number || "",
      inspectionStatus: row.inspection_status || "",
      inspectionCategory: row.inspection_category || "",
      department: row.department_bureau || "",
      address: row.address || "",
      propertyGroup: row.property_group || "",
      latitude: row.latitude || "",
      longitude: row.longitude || "",
    }))

    return NextResponse.json({
      source: {
        dataset: DATASET,
        name: "Chicago Building Violations",
      },
      refreshedAt: new Date().toISOString(),
      count: violations.length,
      violations,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to retrieve building violations",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    )
  }
}

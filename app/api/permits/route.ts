import { NextResponse } from "next/server"

const PERMITS_DATASET = "ydr8-5enu"
const PERMITS_BASE = `https://data.cityofchicago.org/resource/${PERMITS_DATASET}.json`

function buildPermitsQuery(): string {
  return `
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
      work_description
    WHERE application_start_date IS NOT NULL
    ORDER BY application_start_date DESC
    LIMIT 50
  `
    .trim()
    .replace(/\s+/g, " ")
}

export async function GET() {
  const soql = buildPermitsQuery()
  const url = `${PERMITS_BASE}?$query=${encodeURIComponent(soql)}`

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "chi-biz-intel-poc/1.0",
      },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        {
          error: "Upstream Socrata request failed",
          status: res.status,
          details: text.slice(0, 1500),
          url,
          soql,
        },
        { status: 502 }
      )
    }

    const rows = (await res.json()) as Array<{
      permit_?: string
      permit_type?: string
      permit_status?: string
      permit_milestone?: string
      review_type?: string
      application_start_date?: string
      issue_date?: string
      street_number?: string
      street_direction?: string
      street_name?: string
      work_description?: string
    }>

    const permits = rows.map((r) => {
      const address = [r.street_number, r.street_direction, r.street_name]
        .filter(Boolean)
        .join(" ")
        .trim()

      return {
        permitNumber: r.permit_ || "",
        permitType: r.permit_type || "",
        permitStatus: r.permit_status || "",
        permitMilestone: r.permit_milestone || "",
        reviewType: r.review_type || "",
        applicationStartDate: r.application_start_date || "",
        issueDate: r.issue_date || "",
        address,
        workDescription: r.work_description || "",
      }
    })

    return NextResponse.json({
      source: { dataset: PERMITS_DATASET },
      refreshedAt: new Date().toISOString(),
      permits,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    )
  }
}
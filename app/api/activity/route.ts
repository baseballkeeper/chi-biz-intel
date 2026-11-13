
import { NextResponse } from "next/server"

const PERMITS_DATASET = "ydr8-5enu"
const BUSINESSES_DATASET = "uupf-x98q"

const BASE_URL = "https://data.cityofchicago.org/resource"

const FETCH_LIMIT = 100
const RESPONSE_LIMIT = 100

type RawPermit = {
  permit_?: string
  permit_type?: string
  permit_status?: string
  permit_milestone?: string
  application_start_date?: string
  issue_date?: string
  street_number?: string
  street_direction?: string
  street_name?: string
  work_description?: string
  reported_cost?: string
  community_area?: string
}

type RawBusiness = {
  license_id?: string
  license_number?: string
  legal_name?: string
  doing_business_as_name?: string
  address?: string
  community_area_name?: string
  neighborhood?: string
  license_description?: string
  business_activity?: string
  application_type?: string
  date_issued?: string
  license_status?: string
}

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

function buildUrl(dataset: string, query: string): string {
  return `${BASE_URL}/${dataset}.json?$query=${encodeURIComponent(query)}`
}

async function fetchDataset<T>(
  dataset: string,
  query: string
): Promise<T[]> {
  const response = await fetch(buildUrl(dataset, query), {
    next: { revalidate: 900 },
    headers: {
      "User-Agent": "MetroSift/1.0",
    },
  })

  if (!response.ok) {
    throw new Error(
      `Dataset ${dataset} returned HTTP ${response.status}`
    )
  }

  return (await response.json()) as T[]
}

function parseCost(value?: string): number | null {
  if (!value) return null

  const cost = Number(value)

  return Number.isFinite(cost) ? cost : null
}

function normalizePermit(row: RawPermit): Activity {
  const address = [
    row.street_number,
    row.street_direction,
    row.street_name,
  ]
    .filter(Boolean)
    .join(" ")

  const referenceNumber = row.permit_ || ""

  return {
    id: `permit-${referenceNumber}`,
    type: "permit",
    eventType: "application_submitted",
    date: row.application_start_date || "",
    title: row.permit_type || "Building permit application",
    description: row.work_description || "",
    address,
    communityArea: row.community_area || "",
    status: row.permit_status || row.permit_milestone || "",
    referenceNumber,
    reportedCost: parseCost(row.reported_cost),
    sourceUrl:
      `https://data.cityofchicago.org/resource/${PERMITS_DATASET}.json`,
  }
}

function normalizeBusiness(row: RawBusiness): Activity {
  const referenceNumber =
    row.license_id || row.license_number || ""

  return {
    id: `license-${referenceNumber}`,
    type: "business_license",
    eventType: "license_issued",
    date: row.date_issued || "",
    title:
      row.doing_business_as_name ||
      row.legal_name ||
      "Business license issued",
    description:
      row.license_description ||
      row.business_activity ||
      "",
    address: row.address || "",
    communityArea:
      row.community_area_name ||
      row.neighborhood ||
      "",
    status: row.license_status || "",
    referenceNumber,
    reportedCost: null,
    sourceUrl:
      `https://data.cityofchicago.org/resource/${BUSINESSES_DATASET}.json`,
  }
}

export async function GET() {
  const permitsQuery = `
    SELECT
      permit_,
      permit_type,
      permit_status,
      permit_milestone,
      application_start_date,
      issue_date,
      street_number,
      street_direction,
      street_name,
      work_description,
      reported_cost,
      community_area
    WHERE application_start_date IS NOT NULL
    ORDER BY application_start_date DESC
    LIMIT ${FETCH_LIMIT}
  `.trim().replace(/\s+/g, " ")

  const businessesQuery = `
    SELECT
      license_id,
      license_number,
      legal_name,
      doing_business_as_name,
      address,
      community_area_name,
      neighborhood,
      license_description,
      business_activity,
      application_type,
      date_issued,
      license_status
    WHERE application_type = 'ISSUE'
      AND date_issued IS NOT NULL
    ORDER BY date_issued DESC
    LIMIT ${FETCH_LIMIT}
  `.trim().replace(/\s+/g, " ")

  try {
    const [permits, businesses] = await Promise.all([
      fetchDataset<RawPermit>(
        PERMITS_DATASET,
        permitsQuery
      ),
      fetchDataset<RawBusiness>(
        BUSINESSES_DATASET,
        businessesQuery
      ),
    ])

    const activities: Activity[] = [
      ...permits.map(normalizePermit),
      ...businesses.map(normalizeBusiness),
    ]
      .filter((activity) => activity.date)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, RESPONSE_LIMIT)

    return NextResponse.json({
      source: {
        permits: PERMITS_DATASET,
        businesses: BUSINESSES_DATASET,
      },
      refreshedAt: new Date().toISOString(),
      count: activities.length,
      fetchLimitPerDataset: FETCH_LIMIT,
      responseLimit: RESPONSE_LIMIT,
      limited: {
        permits: permits.length === FETCH_LIMIT,
        businesses: businesses.length === FETCH_LIMIT,
      },
      activities,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load commercial activity",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 502 }
    )
  }
}

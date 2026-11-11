
import { NextResponse } from "next/server"

const DATASET = "uupf-x98q"

const BASE_URL =
  `https://data.cityofchicago.org/resource/${DATASET}.json`

type RawBusiness = {
  license_id?: string
  license_number?: string
  legal_name?: string
  doing_business_as_name?: string
  address?: string
  zip_code?: string
  community_area_name?: string
  neighborhood?: string
  license_description?: string
  business_activity?: string
  application_type?: string
  date_issued?: string
  license_start_date?: string
  license_status?: string
}

export async function GET() {
  const soql = `
    SELECT
      license_id,
      license_number,
      legal_name,
      doing_business_as_name,
      address,
      zip_code,
      community_area_name,
      neighborhood,
      license_description,
      business_activity,
      application_type,
      date_issued,
      license_start_date,
      license_status
    WHERE application_type = 'ISSUE'
      AND date_issued IS NOT NULL
    ORDER BY date_issued DESC
    LIMIT 100
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

    const rows = (await response.json()) as RawBusiness[]

    const businesses = rows.map((row) => ({
      licenseId: row.license_id || "",
      licenseNumber: row.license_number || "",
      businessName:
        row.doing_business_as_name ||
        row.legal_name ||
        "Unknown business",
      legalName: row.legal_name || "",
      address: row.address || "",
      zipCode: row.zip_code || "",
      communityArea:
        row.community_area_name ||
        row.neighborhood ||
        "",
      licenseType: row.license_description || "",
      businessActivity: row.business_activity || "",
      applicationType: row.application_type || "",
      dateIssued: row.date_issued || "",
      licenseStartDate: row.license_start_date || "",
      licenseStatus: row.license_status || "",
    }))

    return NextResponse.json({
      source: {
        dataset: DATASET,
        name: "Chicago Business Licenses - Current Active",
      },
      refreshedAt: new Date().toISOString(),
      count: businesses.length,
      businesses,
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

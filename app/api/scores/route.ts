// app/api/scores/route.ts
import { NextResponse } from "next/server"

/**
 * PoC goal:
 * - Count "coffee-ish" businesses by community area using Chicago Open Data.
 * - Return a ranked list that your UI can display.
 *
 * Data source (Socrata / SODA):
 * Business Licenses - Current Active (dataset id: uupf-x98q)
 * Endpoint pattern is documented by Socrata and City of Chicago examples.
 */

const DATASET = "uupf-x98q"
const BASE = `https://data.cityofchicago.org/resource/${DATASET}.json`

function buildCoffeeQuery(): string {
  // Keep this PoC-simple: keyword match across likely text fields.
  // If any field name is wrong, Socrata will return a helpful error message.
  const keywords = ["COFFEE", "CAFE", "ESPRESSO", "ROASTER", "ROASTERS"]

  const likeClauses = keywords
    .map(
      (k) =>
        `(upper(doing_business_as_name) like '%${k}%' OR upper(legal_name) like '%${k}%' OR upper(business_activity) like '%${k}%' OR upper(license_description) like '%${k}%')`
    )
    .join(" OR ")

  // Group by community_area (used by many Chicago datasets; also used by crimes dataset docs) :contentReference[oaicite:1]{index=1}
  // Note: some rows may have null community_area; we filter them out.
  return `
    SELECT community_area, count(1) AS coffee_count
    WHERE community_area IS NOT NULL AND (${likeClauses})
    GROUP BY community_area
    ORDER BY coffee_count DESC
    LIMIT 25
  `
    .trim()
    .replace(/\s+/g, " ")
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get("type") || "coffee").toLowerCase()

  if (type !== "coffee") {
    return NextResponse.json(
      { error: "PoC only supports type=coffee for now." },
      { status: 400 }
    )
  }

  const soql = buildCoffeeQuery()
  const url = `${BASE}?$query=${encodeURIComponent(soql)}`

  try {
    const res = await fetch(url, {
      // Cache for 1 hour (PoC-friendly; avoids hammering Socrata)
      next: { revalidate: 3600 },
      headers: {
        // Optional but good practice: identify your app
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
      community_area: string
      coffee_count: string
    }>

    // Return normalized numbers
    const neighborhoods = rows
      .map((r) => ({
        name: r.community_area,
        coffeeShops: Number(r.coffee_count || 0),
      }))
      .filter((r) => r.name && Number.isFinite(r.coffeeShops))

    return NextResponse.json({
      type,
      source: { dataset: DATASET },
      refreshedAt: new Date().toISOString(),
      neighborhoods,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    )
  }
}
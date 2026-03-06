// app/api/scores/route.ts
import { NextResponse } from "next/server"

const LICENSES_DATASET = "uupf-x98q"
const ACS_DATASET = "t68z-cikk"

const LICENSES_BASE = `https://data.cityofchicago.org/resource/${LICENSES_DATASET}.json`
const ACS_BASE = `https://data.cityofchicago.org/resource/${ACS_DATASET}.json`

const COMMUNITY_AREAS: Record<string, string> = {
  "1": "Rogers Park",
  "2": "West Ridge",
  "3": "Uptown",
  "4": "Lincoln Square",
  "5": "North Center",
  "6": "Lake View",
  "7": "Lincoln Park",
  "8": "Near North Side",
  "9": "Edison Park",
  "10": "Norwood Park",
  "11": "Jefferson Park",
  "12": "Forest Glen",
  "13": "North Park",
  "14": "Albany Park",
  "15": "Portage Park",
  "16": "Irving Park",
  "17": "Dunning",
  "18": "Montclare",
  "19": "Belmont Cragin",
  "20": "Hermosa",
  "21": "Avondale",
  "22": "Logan Square",
  "23": "Humboldt Park",
  "24": "West Town",
  "25": "Austin",
  "26": "West Garfield Park",
  "27": "East Garfield Park",
  "28": "Near West Side",
  "29": "North Lawndale",
  "30": "South Lawndale",
  "31": "Lower West Side",
  "32": "Loop",
  "33": "Near South Side",
  "34": "Armour Square",
  "35": "Douglas",
  "36": "Oakland",
  "37": "Fuller Park",
  "38": "Grand Boulevard",
  "39": "Kenwood",
  "40": "Washington Park",
  "41": "Hyde Park",
  "42": "Woodlawn",
  "43": "South Shore",
  "44": "Chatham",
  "45": "Avalon Park",
  "46": "South Chicago",
  "47": "Burnside",
  "48": "Calumet Heights",
  "49": "Roseland",
  "50": "Pullman",
  "51": "South Deering",
  "52": "East Side",
  "53": "West Pullman",
  "54": "Riverdale",
  "55": "Hegewisch",
  "56": "Garfield Ridge",
  "57": "Archer Heights",
  "58": "Brighton Park",
  "59": "McKinley Park",
  "60": "Bridgeport",
  "61": "New City",
  "62": "West Elsdon",
  "63": "Gage Park",
  "64": "Clearing",
  "65": "West Lawn",
  "66": "Chicago Lawn",
  "67": "West Englewood",
  "68": "Englewood",
  "69": "Greater Grand Crossing",
  "70": "Ashburn",
  "71": "Auburn Gresham",
  "72": "Beverly",
  "73": "Washington Heights",
  "74": "Mount Greenwood",
  "75": "Morgan Park",
  "76": "O'Hare",
  "77": "Edgewater",
}

function buildCoffeeQuery(): string {
  const keywords = ["COFFEE", "CAFE", "ESPRESSO", "ROASTER", "ROASTERS"]

  const likeClauses = keywords
    .map(
      (k) =>
        `(upper(doing_business_as_name) like '%${k}%' OR upper(legal_name) like '%${k}%' OR upper(business_activity) like '%${k}%' OR upper(license_description) like '%${k}%')`
    )
    .join(" OR ")

  return `
    SELECT community_area, count(1) AS coffee_count
    WHERE community_area IS NOT NULL AND (${likeClauses})
    GROUP BY community_area
    ORDER BY coffee_count DESC
    LIMIT 77
  `
    .trim()
    .replace(/\s+/g, " ")
}

async function fetchPopulationByCommunityAreaName() {
  const url = `${ACS_BASE}?$limit=200`

  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: {
      "User-Agent": "chi-biz-intel-poc/1.0",
    },
  })

  if (!res.ok) {
    throw new Error(`ACS request failed: ${res.status}`)
  }

  const rows = (await res.json()) as Array<{
    community_area: string
    total_population: string
    acs_year: string
  }>

  const map = new Map<string, number>()

  for (const row of rows) {
    const areaName = String(row.community_area || "").trim().toUpperCase()
    const population = Number(row.total_population || 0)

    if (areaName && Number.isFinite(population)) {
      map.set(areaName, population)
    }
  }

  return map
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
  const licensesUrl = `${LICENSES_BASE}?$query=${encodeURIComponent(soql)}`

  try {
    const [licensesRes, populationMap] = await Promise.all([
      fetch(licensesUrl, {
        next: { revalidate: 3600 },
        headers: {
          "User-Agent": "chi-biz-intel-poc/1.0",
        },
      }),
      fetchPopulationByCommunityAreaName(),
    ])

    if (!licensesRes.ok) {
      const text = await licensesRes.text()
      return NextResponse.json(
        {
          error: "Upstream Socrata request failed",
          status: licensesRes.status,
          details: text.slice(0, 1500),
          url: licensesUrl,
          soql,
        },
        { status: 502 }
      )
    }

    const rows = (await licensesRes.json()) as Array<{
      community_area: string
      coffee_count: string
    }>

    const neighborhoods = rows
      .map((r) => {
        const areaId = String(r.community_area)
        const areaName = COMMUNITY_AREAS[areaId] || `Area ${areaId}`
        const population =
          populationMap.get(areaName.toUpperCase()) ?? 0
        const coffeeShops = Number(r.coffee_count || 0)
        const coffeePer10k =
          population > 0 ? (coffeeShops / population) * 10000 : null

        return {
          areaId,
          name: areaName,
          coffeeShops,
          population,
          coffeePer10k,
        }
      })
.filter(
  (r) =>
    r.name &&
    Number.isFinite(r.coffeeShops) &&
    r.population >= 15000
)
.sort((a, b) => {
  const aVal = a.coffeePer10k ?? Number.POSITIVE_INFINITY
  const bVal = b.coffeePer10k ?? Number.POSITIVE_INFINITY
  return aVal - bVal
})
.slice(0, 25)

    return NextResponse.json({
      type,
      source: {
        licensesDataset: LICENSES_DATASET,
        populationDataset: ACS_DATASET,
      },
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
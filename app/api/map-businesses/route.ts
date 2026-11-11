import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"

const DATASET = "uupf-x98q"
const BASE_URL = `https://data.cityofchicago.org/resource/${DATASET}.json`
const PAGE_SIZE = 1000
const MAX_CANDIDATES = 20000
const MAX_RESULTS = 500

// The city's neighborhood polygons are approximate, not official boundaries.
type PolygonGeometry = {
  type: "Polygon" | "MultiPolygon"
  coordinates: number[][][] | number[][][][]
}
type NeighborhoodFeature = {
  type: "Feature"
  properties: { pri_neigh?: string }
  geometry: PolygonGeometry
}
type NeighborhoodCollection = {
  type: "FeatureCollection"
  features: NeighborhoodFeature[]
}
type RawBusiness = Record<string, string | undefined>

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
  latitude: number | null
  longitude: number | null
}

function validCoordinate(value: string | undefined, min: number, max: number) {
  if (value === undefined || value.trim() === "") return null
  const number = Number(value)
  return Number.isFinite(number) && number >= min && number <= max
    ? number
    : null
}

function convert(row: RawBusiness): Business {
  return {
    licenseId: row.license_id || "",
    licenseNumber: row.license_number || "",
    businessName: row.doing_business_as_name || row.legal_name || "Unknown business",
    legalName: row.legal_name || "",
    address: row.address || "",
    zipCode: row.zip_code || "",
    communityArea: row.community_area_name || row.neighborhood || "",
    licenseType: row.license_description || "",
    businessActivity: row.business_activity || "",
    applicationType: row.application_type || "",
    dateIssued: row.date_issued || "",
    licenseStartDate: row.license_start_date || "",
    licenseStatus: row.license_status || "",
    latitude: validCoordinate(row.latitude, -90, 90),
    longitude: validCoordinate(row.longitude, -180, 180),
  }
}

function pointInRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function inPolygon(x: number, y: number, rings: number[][][]): boolean {
  if (!rings.length || !pointInRing(x, y, rings[0])) return false
  return !rings.slice(1).some((hole) => pointInRing(x, y, hole))
}

function inGeometry(x: number, y: number, geometry: PolygonGeometry): boolean {
  if (geometry.type === "Polygon") {
    return inPolygon(x, y, geometry.coordinates as number[][][])
  }
  return (geometry.coordinates as number[][][][]).some((polygon) =>
    inPolygon(x, y, polygon)
  )
}

function boundsOf(features: NeighborhoodFeature[]) {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLon = Infinity
  let maxLon = -Infinity

  for (const feature of features) {
    const polygons = feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates as number[][][]]
      : feature.geometry.coordinates as number[][][][]

    for (const polygon of polygons) {
      for (const ring of polygon) {
        for (const [lon, lat] of ring) {
          minLat = Math.min(minLat, lat)
          maxLat = Math.max(maxLat, lat)
          minLon = Math.min(minLon, lon)
          maxLon = Math.max(maxLon, lon)
        }
      }
    }
  }
  return { minLat, maxLat, minLon, maxLon }
}

async function fetchRows(query: string): Promise<RawBusiness[]> {
  const url = `${BASE_URL}?$query=${encodeURIComponent(query)}`
  const response = await fetch(url, {
    next: { revalidate: 900 },
    headers: { "User-Agent": "chi-biz-intel/1.0" },
  })

  if (!response.ok) {
    const details = (await response.text()).slice(0, 1000)
    throw new Error(`Chicago Open Data returned ${response.status}: ${details}`)
  }
  return (await response.json()) as RawBusiness[]
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const area = params.get("area")
  const neighborhood = params.get("neighborhood")?.trim()
  const days = Number(params.get("days") || "30")

  if (
    ![7, 30, 90, 180, 365].includes(days) ||
    Boolean(area) === Boolean(neighborhood) ||
    (area !== null && (!/^\d+$/.test(area) || Number(area) < 1 || Number(area) > 77)) ||
    (neighborhood !== undefined && neighborhood.length > 100)
  ) {
    return NextResponse.json({ error: "Invalid geographic filters" }, { status: 400 })
  }

  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - days)
  const cutoffDate = `${cutoff.toISOString().slice(0, 10)}T00:00:00`

  const select = `SELECT license_id, license_number, legal_name,
    doing_business_as_name, address, zip_code, community_area_name,
    neighborhood, license_description, business_activity,
    application_type, date_issued, license_start_date, license_status,
    latitude, longitude`

  const filters = [
    "application_type = 'ISSUE'",
    "date_issued IS NOT NULL",
    `date_issued >= '${cutoffDate}'`,
  ]

  try {
    if (area) {
      filters.push(`community_area = '${Number(area)}'`)
      const query = `${select} WHERE ${filters.join(" AND ")}
        ORDER BY date_issued DESC LIMIT ${MAX_RESULTS}`.replace(/\s+/g, " ")
      const rows = await fetchRows(query)
      const businesses = rows.map(convert)
      return NextResponse.json({
        source: { dataset: DATASET },
        geography: "community_area",
        count: businesses.length,
        limited: rows.length === MAX_RESULTS,
        complete: rows.length < MAX_RESULTS,
        businesses,
      })
    }

    const file = path.join(process.cwd(), "data", "geography", "neighborhoods.geojson")
    const collection = JSON.parse(await readFile(file, "utf8")) as NeighborhoodCollection
    const matching = collection.features.filter(
      (feature) => feature.properties.pri_neigh?.toLowerCase() === neighborhood?.toLowerCase()
    )

    if (!matching.length) {
      return NextResponse.json({ error: "Neighborhood not found" }, { status: 404 })
    }

    const bounds = boundsOf(matching)
    if (![bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon].every(Number.isFinite)) {
      throw new Error("Neighborhood boundary has invalid coordinates")
    }

    filters.push("latitude IS NOT NULL", "longitude IS NOT NULL")
    filters.push(`latitude >= ${bounds.minLat}`, `latitude <= ${bounds.maxLat}`)
    filters.push(`longitude >= ${bounds.minLon}`, `longitude <= ${bounds.maxLon}`)

    const businesses: Business[] = []
    let matched = 0
    let candidatesScanned = 0
    let complete = false

    for (let offset = 0; offset < MAX_CANDIDATES; offset += PAGE_SIZE) {
      const query = `${select} WHERE ${filters.join(" AND ")}
        ORDER BY date_issued DESC, license_id DESC
        LIMIT ${PAGE_SIZE} OFFSET ${offset}`.replace(/\s+/g, " ")
      const rows = await fetchRows(query)
      candidatesScanned += rows.length

      for (const row of rows) {
        const business = convert(row)
        if (business.latitude === null || business.longitude === null) continue
        if (!matching.some((feature) =>
          inGeometry(business.longitude!, business.latitude!, feature.geometry)
        )) continue

        matched++
        if (businesses.length < MAX_RESULTS) businesses.push(business)
      }

      if (rows.length < PAGE_SIZE) {
        complete = true
        break
      }
    }

    return NextResponse.json({
      source: { dataset: DATASET },
      geography: "approximate_neighborhood_polygon",
      count: matched,
      matched,
      limited: matched > MAX_RESULTS || !complete,
      complete,
      candidatesScanned,
      coordinateBased: true,
      businesses,
      note: "Neighborhood matching excludes licenses without usable coordinates.",
    })
  } catch (error) {
    return NextResponse.json({
      error: "Business license geographic request failed",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 502 })
  }
}

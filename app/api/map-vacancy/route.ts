import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";

export const runtime = "nodejs";

const MODERN_DATASET = "v6vf-nfxy";
const HISTORICAL_DATASET = "7nii-7srd";
const PAGE_SIZE = 1000;
const MAX_CANDIDATES_PER_SOURCE = 20000;
const MAX_RETURNED = 2000;
const ALLOWED_DAYS = [7, 30, 90, 180, 365];

type Layer = "communities" | "neighborhoods";
type Properties = { community?: string; area_numbe?: string | number; pri_neigh?: string };
type AreaFeature = Feature<Geometry, Properties>;
type AreaCollection = FeatureCollection<Geometry, Properties>;
type RawRow = Record<string, unknown>;

type Bounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

function polygons(geometry: Geometry): Position[][][] {
  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }

  return [];
}

function boundsFor(geometry: Geometry): Bounds {
  const bounds: Bounds = {
    minLat: Infinity,
    maxLat: -Infinity,
    minLon: Infinity,
    maxLon: -Infinity,
  };

  for (const polygon of polygons(geometry)) {
    for (const ring of polygon) {
      for (const [lon, lat] of ring) {
        bounds.minLat = Math.min(bounds.minLat, lat);
        bounds.maxLat = Math.max(bounds.maxLat, lat);
        bounds.minLon = Math.min(bounds.minLon, lon);
        bounds.maxLon = Math.max(bounds.maxLon, lon);
      }
    }
  }

  return bounds;
}

function onSegment(
  x: number,
  y: number,
  a: Position,
  b: Position
): boolean {
  const cross =
    (x - a[0]) * (b[1] - a[1]) -
    (y - a[1]) * (b[0] - a[0]);

  if (Math.abs(cross) > 1e-10) {
    return false;
  }

  return (
    (x - a[0]) * (x - b[0]) +
    (y - a[1]) * (y - b[1])
  ) <= 1e-10;
}

function inRing(
  lon: number,
  lat: number,
  ring: Position[]
): boolean {
  let inside = false;

  for (
    let i = 0, j = ring.length - 1;
    i < ring.length;
    j = i++
  ) {
    const a = ring[i];
    const b = ring[j];

    if (onSegment(lon, lat, a, b)) {
      return true;
    }

    if (
      (a[1] > lat) !== (b[1] > lat) &&
      lon <
        ((b[0] - a[0]) * (lat - a[1])) /
          (b[1] - a[1]) +
          a[0]
    ) {
      inside = !inside;
    }
  }

  return inside;
}

function inGeometry(
  lon: number,
  lat: number,
  geometry: Geometry
): boolean {
  for (const polygon of polygons(geometry)) {
    if (
      !polygon.length ||
      !inRing(lon, lat, polygon[0])
    ) {
      continue;
    }

    const insideHole = polygon
      .slice(1)
      .some((ring) => inRing(lon, lat, ring));

    if (!insideHole) {
      return true;
    }
  }

  return false;
}

type VacancyRecord = {
  id: string;
  source: "modern_311" | "historical_archive";
  sourceLabel: string;
  date: string;
  address: string;
  status: string;
  type: string;
  latitude: number;
  longitude: number;
  details: Record<string, string>;
};

function field(row: RawRow, name: string): string {
  const value = row[name];
  return value === null || value === undefined ? "" : String(value);
}

function formatRecord(row: RawRow, source: "modern_311" | "historical_archive"): VacancyRecord {
  const historical = source === "historical_archive";
  const address = historical
    ? ["address_street_number", "address_street_direction", "address_street_name", "address_street_suffix"]
        .map((key) => field(row, key)).filter(Boolean).join(" ")
    : field(row, "street_address");
  const details: Record<string, string> = {};
  if (historical) {
    for (const [key, label] of [
      ["is_the_building_currently_vacant_or_occupied_", "Reported occupancy"],
      ["is_building_open_or_boarded_", "Reported open/boarded condition"],
      ["is_the_building_dangerous_or_hazardous_", "Reported danger/hazard"],
      ["is_the_building_vacant_due_to_fire_", "Reported fire-related vacancy"],
    ]) {
      const value = field(row, key);
      if (value) details[label] = value;
    }
  } else {
    const closed = field(row, "closed_date");
    if (closed) details["Closed date"] = closed;
    const duplicate = field(row, "duplicate");
    if (duplicate) details["311 duplicate flag"] = duplicate;
  }
  return {
    id: historical ? field(row, "service_request_number") : field(row, "sr_number"),
    source,
    sourceLabel: historical ? "Historical vacant-building report" : "Modern 311 vacant-building complaint",
    date: historical ? field(row, "date_service_request_was_received") : field(row, "created_date"),
    address,
    status: historical ? "Historical report — current status unknown" : field(row, "status"),
    type: historical ? "Vacant/abandoned building report" : field(row, "sr_type"),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    details,
  };
}

async function querySource(
  dataset: string,
  select: string,
  where: string,
  order: string,
  features: AreaFeature[],
  source: "modern_311" | "historical_archive"
) {
  const records: VacancyRecord[] = [];
  let matched = 0;
  let candidatesScanned = 0;
  let complete = false;
  const base = `https://data.cityofchicago.org/resource/${dataset}.json`;
  while (candidatesScanned < MAX_CANDIDATES_PER_SOURCE) {
    const limit = Math.min(PAGE_SIZE, MAX_CANDIDATES_PER_SOURCE - candidatesScanned);
    const query = `SELECT ${select} WHERE ${where} ORDER BY ${order} LIMIT ${limit} OFFSET ${candidatesScanned}`;
    const response = await fetch(`${base}?$query=${encodeURIComponent(query)}`, {
      next: { revalidate: 900 },
      headers: { "User-Agent": "MetroSift/1.0" },
    });
    if (!response.ok) {
      const details = (await response.text()).slice(0, 500);
      throw new Error(`Chicago dataset ${dataset} returned ${response.status}: ${details}`);
    }
    const rows = (await response.json()) as RawRow[];
    if (!Array.isArray(rows)) throw new Error(`Invalid response from dataset ${dataset}`);
    for (const row of rows) {
      if (row.latitude === null || row.latitude === undefined || row.longitude === null || row.longitude === undefined) continue;
      const lat = Number(row.latitude);
      const lon = Number(row.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
      if (!features.some((feature) => inGeometry(lon, lat, feature.geometry))) continue;
      matched++;
      if (records.length < MAX_RETURNED) records.push(formatRecord(row, source));
    }
    candidatesScanned += rows.length;
    if (rows.length < limit) { complete = true; break; }
  }
  if (!complete) throw new Error(`Dataset ${dataset} exceeded its ${MAX_CANDIDATES_PER_SOURCE.toLocaleString()}-candidate safety limit. Narrow the date range or geography.`);
  return { records, matched, candidatesScanned };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const area = (params.get("area") || "").trim();
  const neighborhood = (params.get("neighborhood") || "").trim();
  const days = Number(params.get("days") || "30");
  const areaNumber = Number(area);
  const usingArea = Boolean(area) && !neighborhood;
  const usingNeighborhood = Boolean(neighborhood) && !area;
  if ((!usingArea && !usingNeighborhood) || !ALLOWED_DAYS.includes(days) ||
      (usingArea && (!Number.isInteger(areaNumber) || areaNumber < 1 || areaNumber > 77)) ||
      (usingNeighborhood && neighborhood.length > 100)) {
    return NextResponse.json({ error: "Specify either area (1-77) or neighborhood and days (7, 30, 90, 180, 365)." }, { status: 400 });
  }
  const layer: Layer = usingArea ? "communities" : "neighborhoods";
  try {
    const filename = layer === "communities" ? "community-areas.geojson" : "neighborhoods.geojson";
    const geography = JSON.parse(await readFile(path.join(process.cwd(), "data", "geography", filename), "utf8")) as AreaCollection;
    const features = geography.features.filter((feature) => usingArea
      ? Number(feature.properties?.area_numbe) === areaNumber
      : (feature.properties?.pri_neigh || "").trim().toLowerCase() === neighborhood.toLowerCase());
    if (!features.length) return NextResponse.json({ error: "Geographic area not found" }, { status: 404 });
    const boxes = features.map((feature) => boundsFor(feature.geometry));
    const bounds: Bounds = {
      minLat: Math.min(...boxes.map((b) => b.minLat)), maxLat: Math.max(...boxes.map((b) => b.maxLat)),
      minLon: Math.min(...boxes.map((b) => b.minLon)), maxLon: Math.max(...boxes.map((b) => b.maxLon)),
    };
    if (!Object.values(bounds).every(Number.isFinite)) throw new Error("Invalid geographic boundaries");
    const geoWhere = ["latitude IS NOT NULL", "longitude IS NOT NULL",
      `latitude >= ${bounds.minLat}`, `latitude <= ${bounds.maxLat}`,
      `longitude >= ${bounds.minLon}`, `longitude <= ${bounds.maxLon}`].join(" AND ");
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    const date = cutoff.toISOString().slice(0, 10);
    const modernWhere = [geoWhere, "sr_type = 'Vacant/Abandoned Building Complaint'", `created_date >= '${date}T00:00:00'`,
      ...(usingArea ? [`community_area = ${areaNumber}`] : [])].join(" AND ");
    const historicalWhere = [geoWhere, "date_service_request_was_received < '2018-12-18T00:00:00'"].join(" AND ");
    const [modern, historical] = await Promise.all([
      querySource("v6vf-nfxy", "sr_number,sr_type,status,created_date,closed_date,street_address,duplicate,latitude,longitude",
        modernWhere, "created_date DESC,sr_number DESC", features, "modern_311"),
      querySource("7nii-7srd", "service_request_number,date_service_request_was_received,is_the_building_currently_vacant_or_occupied_,is_building_open_or_boarded_,is_the_building_dangerous_or_hazardous_,is_the_building_vacant_due_to_fire_,address_street_number,address_street_direction,address_street_name,address_street_suffix,latitude,longitude",
        historicalWhere, "date_service_request_was_received DESC,service_request_number DESC", features, "historical_archive"),
    ]);
    // Keep source identities distinct; a report does not prove an individual building is currently vacant.
    const records = [...modern.records, ...historical.records]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, MAX_RETURNED);
    const matched = modern.matched + historical.matched;
    return NextResponse.json({
      source: { modernDataset: MODERN_DATASET, historicalDataset: HISTORICAL_DATASET },
      geography: usingArea ? "community_area_polygon" : "approximate_neighborhood_polygon",
      area: usingArea ? areaNumber : undefined,
      neighborhood: usingNeighborhood ? neighborhood : undefined,
      days,
      modernDateRange: `Last ${days} days`, historicalDateRange: "Before December 18, 2018 (historical archive)",
      count: matched, matched, returned: records.length, limited: matched > MAX_RETURNED, complete: true,
      modernCount: modern.matched, historicalCount: historical.matched,
      coordinateBased: true,
      candidatesScanned: modern.candidatesScanned + historical.candidatesScanned,
      refreshedAt: new Date().toISOString(), records,
      note: "Historical reports are archival; modern records are 311 complaints. Neither proves current vacancy. Only geocoded records within the selected boundary are included. The selected days filter applies to modern 311 complaints only.",
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    const limit = details.includes("safety limit");
    return NextResponse.json({ error: limit ? "Geographic vacancy search exceeded its safety limit" : "Geographic vacant-building search failed", details }, { status: limit ? 422 : 500 });
  }
}

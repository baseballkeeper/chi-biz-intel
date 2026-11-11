import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";

export const runtime = "nodejs";

const DATASET = "4ijn-s7e5";
const BASE_URL = `https://data.cityofchicago.org/resource/${DATASET}.json`;
const PAGE_SIZE = 1000;
const MAX_CANDIDATES = 20000;
const MAX_RETURNED = 2000;
const ALLOWED_DAYS = [7, 30, 90, 180, 365];

type Layer = "communities" | "neighborhoods";
type Properties = {
  community?: string;
  area_numbe?: string | number;
  pri_neigh?: string;
};
type AreaFeature = Feature<Geometry, Properties>;
type AreaCollection = FeatureCollection<Geometry, Properties>;
type RawInspection = Record<string, string | undefined>;
type Bounds = { minLat: number; maxLat: number; minLon: number; maxLon: number };

function polygons(geometry: Geometry): Position[][][] {
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function boundsFor(geometry: Geometry): Bounds {
  const bounds: Bounds = {
    minLat: Infinity, maxLat: -Infinity, minLon: Infinity, maxLon: -Infinity,
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

function onSegment(x: number, y: number, a: Position, b: Position): boolean {
  const cross = (x - a[0]) * (b[1] - a[1]) - (y - a[1]) * (b[0] - a[0]);
  if (Math.abs(cross) > 1e-10) return false;
  return (x - a[0]) * (x - b[0]) + (y - a[1]) * (y - b[1]) <= 1e-10;
}

function inRing(lon: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (onSegment(lon, lat, a, b)) return true;
    if ((a[1] > lat) !== (b[1] > lat) &&
        lon < ((b[0] - a[0]) * (lat - a[1])) / (b[1] - a[1]) + a[0]) {
      inside = !inside;
    }
  }
  return inside;
}

function inGeometry(lon: number, lat: number, geometry: Geometry): boolean {
  for (const polygon of polygons(geometry)) {
    if (!polygon.length || !inRing(lon, lat, polygon[0])) continue;
    if (!polygon.slice(1).some((ring) => inRing(lon, lat, ring))) return true;
  }
  return false;
}

function formatInspection(row: RawInspection) {
  return {
    id: row.inspection_id || "",
    businessName: row.dba_name || row.aka_name || "Unknown",
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
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const area = (params.get("area") || "").trim();
  const neighborhood = (params.get("neighborhood") || "").trim();
  const days = Number(params.get("days") || "30");
  const areaNumber = Number(area);
  const usingArea = area !== "" && neighborhood === "";
  const usingNeighborhood = neighborhood !== "" && area === "";

  if ((!usingArea && !usingNeighborhood) ||
      !ALLOWED_DAYS.includes(days) ||
      (usingArea && (!Number.isInteger(areaNumber) || areaNumber < 1 || areaNumber > 77)) ||
      (usingNeighborhood && neighborhood.length > 100)) {
    return NextResponse.json(
      { error: "Specify either a valid community area (1-77) or neighborhood, and days (7, 30, 90, 180, 365)." },
      { status: 400 }
    );
  }

  const layer: Layer = usingArea ? "communities" : "neighborhoods";

  try {
    const filename = layer === "communities" ? "community-areas.geojson" : "neighborhoods.geojson";
    const filepath = path.join(process.cwd(), "data", "geography", filename);
    const geography = JSON.parse(await readFile(filepath, "utf8")) as AreaCollection;
    const matchingFeatures = geography.features.filter((feature) => {
      if (layer === "communities") return Number(feature.properties?.area_numbe) === areaNumber;
      return (feature.properties?.pri_neigh || "").trim().toLowerCase() === neighborhood.toLowerCase();
    });

    if (!matchingFeatures.length) {
      return NextResponse.json({ error: "Geographic area not found" }, { status: 404 });
    }

    const allBounds = matchingFeatures.map((feature) => boundsFor(feature.geometry));
    const bounds: Bounds = {
      minLat: Math.min(...allBounds.map((b) => b.minLat)),
      maxLat: Math.max(...allBounds.map((b) => b.maxLat)),
      minLon: Math.min(...allBounds.map((b) => b.minLon)),
      maxLon: Math.max(...allBounds.map((b) => b.maxLon)),
    };
    if (!Object.values(bounds).every(Number.isFinite)) {
      throw new Error("Invalid geographic boundaries");
    }

    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    const date = cutoff.toISOString().slice(0, 10);
    const where = [
      `inspection_date >= '${date}T00:00:00'`,
      "latitude IS NOT NULL",
      "longitude IS NOT NULL",
      `latitude >= ${bounds.minLat}`,
      `latitude <= ${bounds.maxLat}`,
      `longitude >= ${bounds.minLon}`,
      `longitude <= ${bounds.maxLon}`,
    ].join(" AND ");

    const inspections: ReturnType<typeof formatInspection>[] = [];
    let matched = 0;
    let candidatesScanned = 0;
    let complete = false;

    while (candidatesScanned < MAX_CANDIDATES) {
      const query = `
        SELECT inspection_id, dba_name, aka_name, license_, facility_type,
          risk, address, city, state, zip, inspection_date, inspection_type,
          results, violations, latitude, longitude
        WHERE ${where}
        ORDER BY inspection_date DESC, inspection_id DESC
        LIMIT ${PAGE_SIZE} OFFSET ${candidatesScanned}
      `.replace(/\s+/g, " ").trim();
      const url = `${BASE_URL}?$query=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        next: { revalidate: 900 },
        headers: { "User-Agent": "MetroSift/1.0" },
      });
      if (!response.ok) {
        const details = await response.text();
        return NextResponse.json({
          error: "Chicago Open Data request failed",
          status: response.status,
          details: details.slice(0, 1000),
        }, { status: 502 });
      }
      const rows = (await response.json()) as RawInspection[];
      for (const row of rows) {
        const lat = Number(row.latitude);
        const lon = Number(row.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        if (matchingFeatures.some((feature) => inGeometry(lon, lat, feature.geometry))) {
          matched++;
          if (inspections.length < MAX_RETURNED) inspections.push(formatInspection(row));
        }
      }
      candidatesScanned += rows.length;
      if (rows.length < PAGE_SIZE) {
        complete = true;
        break;
      }
    }

    if (!complete) {
      return NextResponse.json({
        error: "The geographic search exceeded its safety limit. Try a shorter date range.",
        candidatesScanned,
      }, { status: 422 });
    }

    return NextResponse.json({
      source: { dataset: DATASET, name: "Chicago Food Inspections" },
      geography: layer === "communities" ? "community_area_polygon" : "approximate_neighborhood_polygon",
      area: usingArea ? areaNumber : undefined,
      neighborhood: usingNeighborhood ? neighborhood : undefined,
      days,
      count: matched,
      matched,
      returned: inspections.length,
      limited: matched > MAX_RETURNED,
      complete: true,
      coordinateBased: true,
      candidatesScanned,
      refreshedAt: new Date().toISOString(),
      inspections,
      note: "Results include only inspections with usable coordinates inside the selected boundary. Inspection outcomes describe individual inspections, not necessarily a business's current status.",
    });
  } catch (error) {
    return NextResponse.json({
      error: "Geographic food inspection search failed",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

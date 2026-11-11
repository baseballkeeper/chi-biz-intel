
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  Position,
} from "geojson";

export const runtime = "nodejs";

const DATASET = "ydr8-5enu";
const BASE_URL =
  `https://data.cityofchicago.org/resource/${DATASET}.json`;

const PAGE_SIZE = 1000;
const MAX_CANDIDATES = 20000;
const MAX_RETURNED = 500;

type NeighborhoodProperties = {
  pri_neigh?: string;
  sec_neigh?: string;
};

type NeighborhoodFeature = Feature<
  Geometry,
  NeighborhoodProperties
>;

type NeighborhoodCollection = FeatureCollection<
  Geometry,
  NeighborhoodProperties
>;

type RawPermit = Record<string, string | undefined>;

type Bounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

function ringsFromGeometry(
  geometry: Geometry
): Position[][][] {
  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }

  return [];
}

function getBounds(geometry: Geometry): Bounds {
  const polygons = ringsFromGeometry(geometry);

  const bounds: Bounds = {
    minLat: Infinity,
    maxLat: -Infinity,
    minLon: Infinity,
    maxLon: -Infinity,
  };

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const position of ring) {
        const [lon, lat] = position;

        bounds.minLat = Math.min(bounds.minLat, lat);
        bounds.maxLat = Math.max(bounds.maxLat, lat);
        bounds.minLon = Math.min(bounds.minLon, lon);
        bounds.maxLon = Math.max(bounds.maxLon, lon);
      }
    }
  }

  return bounds;
}

function pointOnSegment(
  x: number,
  y: number,
  a: Position,
  b: Position
): boolean {
  const epsilon = 1e-10;

  const cross =
    (x - a[0]) * (b[1] - a[1]) -
    (y - a[1]) * (b[0] - a[0]);

  if (Math.abs(cross) > epsilon) return false;

  const dot =
    (x - a[0]) * (x - b[0]) +
    (y - a[1]) * (y - b[1]);

  return dot <= epsilon;
}

function pointInRing(
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

    if (pointOnSegment(lon, lat, a, b)) {
      return true;
    }

    const intersects =
      (a[1] > lat) !== (b[1] > lat) &&
      lon <
        ((b[0] - a[0]) * (lat - a[1])) /
          (b[1] - a[1]) +
          a[0];

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function pointInGeometry(
  lon: number,
  lat: number,
  geometry: Geometry
): boolean {
  const polygons = ringsFromGeometry(geometry);

  for (const polygon of polygons) {
    if (!polygon.length) continue;

    // First ring is the outer boundary.
    if (!pointInRing(lon, lat, polygon[0])) {
      continue;
    }

    // Remaining rings represent holes.
    const inHole = polygon
      .slice(1)
      .some((ring) => pointInRing(lon, lat, ring));

    if (!inHole) {
      return true;
    }
  }

  return false;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function formatPermit(row: RawPermit) {
  const address = [
    row.street_number,
    row.street_direction,
    row.street_name,
  ]
    .filter(Boolean)
    .join(" ");

  const cost = row.reported_cost
    ? Number(row.reported_cost)
    : null;

  return {
    permitNumber: row.permit_ || "",
    permitType: row.permit_type || "",
    permitStatus: row.permit_status || "",
    permitMilestone: row.permit_milestone || "",
    applicationStartDate:
      row.application_start_date || "",
    issueDate: row.issue_date || "",
    address,
    workDescription: row.work_description || "",
    reportedCost:
      cost !== null && Number.isFinite(cost)
        ? cost
        : null,
    communityArea: row.community_area || "",
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const neighborhood = (
    params.get("neighborhood") || ""
  ).trim();

  const days = Number(params.get("days") || 30);

  if (
    !neighborhood ||
    neighborhood.length > 100 ||
    ![7, 30, 90, 180, 365].includes(days)
  ) {
    return NextResponse.json(
      { error: "Invalid neighborhood or days parameter" },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "geography",
      "neighborhoods.geojson"
    );

    const file = await readFile(filePath, "utf8");

    const geography = JSON.parse(
      file
    ) as NeighborhoodCollection;

    const matchingFeatures = geography.features.filter(
      (feature) =>
        normalizeName(
          feature.properties?.pri_neigh || ""
        ) === normalizeName(neighborhood)
    );

    if (!matchingFeatures.length) {
      return NextResponse.json(
        { error: "Neighborhood not found" },
        { status: 404 }
      );
    }

    // Combine bounding boxes if multiple polygons
    // share the same neighborhood name.
    const boundsList = matchingFeatures.map(
      (feature) => getBounds(feature.geometry)
    );

    const bounds: Bounds = {
      minLat: Math.min(...boundsList.map((b) => b.minLat)),
      maxLat: Math.max(...boundsList.map((b) => b.maxLat)),
      minLon: Math.min(...boundsList.map((b) => b.minLon)),
      maxLon: Math.max(...boundsList.map((b) => b.maxLon)),
    };

    if (
      !Object.values(bounds).every(Number.isFinite)
    ) {
      throw new Error("Invalid neighborhood geometry");
    }

    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - days);

    const cutoffDate = cutoff
      .toISOString()
      .slice(0, 10);

    const where = [
      `application_start_date >= '${cutoffDate}T00:00:00'`,
      "latitude IS NOT NULL",
      "longitude IS NOT NULL",
      `latitude >= ${bounds.minLat}`,
      `latitude <= ${bounds.maxLat}`,
      `longitude >= ${bounds.minLon}`,
      `longitude <= ${bounds.maxLon}`,
    ].join(" AND ");

    const matchingPermits: ReturnType<
      typeof formatPermit
    >[] = [];

    let candidatesScanned = 0;
    let complete = false;

    // Paginate all records in the bounding box,
    // rather than filtering only the latest 500
    // permits across Chicago.
    while (candidatesScanned < MAX_CANDIDATES) {
      const query = `
        SELECT
          id,
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
          community_area,
          latitude,
          longitude
        WHERE ${where}
        ORDER BY application_start_date DESC, id DESC
        LIMIT ${PAGE_SIZE}
        OFFSET ${candidatesScanned}
      `.replace(/\s+/g, " ").trim();

      const url =
        `${BASE_URL}?$query=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        next: { revalidate: 900 },
        headers: {
          "User-Agent": "MetroSift/1.0",
        },
      });

      if (!response.ok) {
        const details = await response.text();

        return NextResponse.json(
          {
            error: "Chicago Open Data request failed",
            status: response.status,
            details: details.slice(0, 1000),
          },
          { status: 502 }
        );
      }

      const rows = (await response.json()) as RawPermit[];

      for (const row of rows) {
        const lat = Number(row.latitude);
        const lon = Number(row.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          continue;
        }

        const isInside = matchingFeatures.some(
          (feature) =>
            pointInGeometry(
              lon,
              lat,
              feature.geometry
            )
        );

        if (isInside) {
          matchingPermits.push(formatPermit(row));
        }
      }

      candidatesScanned += rows.length;

      if (rows.length < PAGE_SIZE) {
        complete = true;
        break;
      }
    }

    // Do not present potentially incomplete results
    // as a complete neighborhood count.
    if (!complete) {
      return NextResponse.json(
        {
          error:
            "The geographic search exceeded its safety limit. Try a shorter date range.",
          candidatesScanned,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      source: { dataset: DATASET },
      neighborhood,
      days,
      matched: matchingPermits.length,
      count: Math.min(
        matchingPermits.length,
        MAX_RETURNED
      ),
      limited:
        matchingPermits.length > MAX_RETURNED,
      candidatesScanned,
      complete: true,
      coordinateBased: true,
      refreshedAt: new Date().toISOString(),
      permits: matchingPermits.slice(0, MAX_RETURNED),
      note:
        "Matches are based on available permit coordinates and approximate neighborhood boundaries. Records without coordinates are excluded.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Neighborhood permit search failed",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

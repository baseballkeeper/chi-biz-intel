
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

const BASE_URL =
  "https://data.cityofchicago.org/resource/v6vf-nfxy.json";

const PAGE_SIZE = 1000;
const MAX_CANDIDATES = 20000;
const MAX_RETURNED = 2000;
const ALLOWED_DAYS = [7, 30, 90, 180, 365];

type Properties = {
  community?: string;
  area_numbe?: string | number;
  pri_neigh?: string;
};

type AreaFeature = Feature<Geometry, Properties>;
type AreaCollection = FeatureCollection<Geometry, Properties>;
type RawRequest = Record<string, string | undefined>;

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

function coordinate(
  value: string | undefined,
  min: number,
  max: number
): number | null {
  if (value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) &&
    number >= min &&
    number <= max
    ? number
    : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const area = (params.get("area") || "").trim();
  const neighborhood =
    (params.get("neighborhood") || "").trim();

  const days = Number(params.get("days") || "30");
  const type = (params.get("type") || "all").trim();

  const usingArea =
    area !== "" && neighborhood === "";

  const usingNeighborhood =
    neighborhood !== "" && area === "";

  const areaNumber = Number(area);

  if (
    (!usingArea && !usingNeighborhood) ||
    !ALLOWED_DAYS.includes(days) ||
    (
      usingArea &&
      (
        !Number.isInteger(areaNumber) ||
        areaNumber < 1 ||
        areaNumber > 77
      )
    ) ||
    (
      usingNeighborhood &&
      neighborhood.length > 100
    ) ||
    type.length > 120 ||
    !/^[\w\s/(),.&'-]+$/.test(type)
  ) {
    return NextResponse.json(
      {
        error:
          "Specify a valid area (1-77) or neighborhood, " +
          "days (7, 30, 90, 180, 365), and optional request type.",
      },
      { status: 400 }
    );
  }

  const layer = usingArea
    ? "communities"
    : "neighborhoods";

  try {
    const filename = usingArea
      ? "community-areas.geojson"
      : "neighborhoods.geojson";

    const geography = JSON.parse(
      await readFile(
        path.join(
          process.cwd(),
          "data",
          "geography",
          filename
        ),
        "utf8"
      )
    ) as AreaCollection;

    const matchingFeatures: AreaFeature[] =
      geography.features.filter((feature) =>
        usingArea
          ? Number(
              feature.properties?.area_numbe
            ) === areaNumber
          : (
              feature.properties?.pri_neigh || ""
            ).trim().toLowerCase() ===
            neighborhood.toLowerCase()
      );

    if (!matchingFeatures.length) {
      return NextResponse.json(
        { error: "Geographic area not found" },
        { status: 404 }
      );
    }

    const allBounds = matchingFeatures.map(
      (feature) => boundsFor(feature.geometry)
    );

    const bounds: Bounds = {
      minLat: Math.min(
        ...allBounds.map((b) => b.minLat)
      ),
      maxLat: Math.max(
        ...allBounds.map((b) => b.maxLat)
      ),
      minLon: Math.min(
        ...allBounds.map((b) => b.minLon)
      ),
      maxLon: Math.max(
        ...allBounds.map((b) => b.maxLon)
      ),
    };

    if (
      !Object.values(bounds).every(
        Number.isFinite
      )
    ) {
      throw new Error(
        "Invalid geographic boundaries"
      );
    }

    const cutoff = new Date();

    cutoff.setUTCDate(
      cutoff.getUTCDate() - days
    );

    const date = cutoff
      .toISOString()
      .slice(0, 10);

    const where = [
      `created_date >= '${date}T00:00:00'`,
      "latitude IS NOT NULL",
      "longitude IS NOT NULL",
      `latitude >= ${bounds.minLat}`,
      `latitude <= ${bounds.maxLat}`,
      `longitude >= ${bounds.minLon}`,
      `longitude <= ${bounds.maxLon}`,
      ...(usingArea
        ? [`community_area = ${areaNumber}`]
        : []),
      ...(type.toLowerCase() !== "all"
        ? [
            `sr_type = '${type.replace(
              /'/g,
              "''"
            )}'`,
          ]
        : []),
    ].join(" AND ");

    const records: Array<{
      requestNumber: string;
      type: string;
      status: string;
      createdDate: string;
      closedDate: string;
      address: string;
      duplicate: boolean;
      communityArea: string;
      latitude: number;
      longitude: number;
    }> = [];

    let matched = 0;
    let candidatesScanned = 0;
    let complete = false;

    while (
      candidatesScanned < MAX_CANDIDATES
    ) {
      const query = `
        SELECT
          sr_number,
          sr_type,
          status,
          created_date,
          closed_date,
          street_address,
          duplicate,
          community_area,
          latitude,
          longitude
        WHERE ${where}
        ORDER BY created_date DESC, sr_number DESC
        LIMIT ${PAGE_SIZE}
        OFFSET ${candidatesScanned}
      `
        .replace(/\s+/g, " ")
        .trim();

      const url =
        `${BASE_URL}?$query=` +
        encodeURIComponent(query);

      const response = await fetch(url, {
        next: { revalidate: 900 },
        headers: {
          "User-Agent": "MetroSift/1.0",
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            error:
              "Chicago 311 Open Data request failed",
            upstreamStatus: response.status,
          },
          { status: 502 }
        );
      }

      const rows =
        (await response.json()) as RawRequest[];

      for (const row of rows) {
        const lat = coordinate(
          row.latitude,
          -90,
          90
        );

        const lon = coordinate(
          row.longitude,
          -180,
          180
        );

        if (
          lat === null ||
          lon === null
        ) {
          continue;
        }

        if (
          !matchingFeatures.some((feature) =>
            inGeometry(
              lon,
              lat,
              feature.geometry
            )
          )
        ) {
          continue;
        }

        matched++;

        if (
          records.length < MAX_RETURNED
        ) {
          records.push({
            requestNumber: row.sr_number || "",
            type: row.sr_type || "",
            status: row.status || "",
            createdDate:
              row.created_date || "",
            closedDate:
              row.closed_date || "",
            address:
              row.street_address || "",
duplicate: String(row.duplicate ?? "").toLowerCase() === "true",
            communityArea:
              row.community_area || "",
            latitude: lat,
            longitude: lon,
          });
        }
      }

      candidatesScanned += rows.length;

      if (
        rows.length < PAGE_SIZE
      ) {
        complete = true;
        break;
      }
    }

    if (!complete) {
      return NextResponse.json(
        {
          error:
            "The 311 geographic search exceeded its safety limit. " +
            "Try a shorter date range or a specific request type.",
          candidatesScanned,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      source: {
        dataset: "v6vf-nfxy",
        name: "Chicago 311 Service Requests",
      },
      geography: usingArea
        ? "community_area_polygon"
        : "approximate_neighborhood_polygon",
      area: usingArea
        ? areaNumber
        : undefined,
      neighborhood: usingNeighborhood
        ? neighborhood
        : undefined,
      days,
      type,
      count: matched,
      matched,
      returned: records.length,
      limited: matched > MAX_RETURNED,
      complete: true,
      coordinateBased: true,
      candidatesScanned,
      refreshedAt: new Date().toISOString(),
      requests: records,
      note:
        "These are reported 311 service requests, not " +
        "verified violations or current property conditions. " +
        "Only geocoded records within the selected boundary are included.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Geographic 311 search failed",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

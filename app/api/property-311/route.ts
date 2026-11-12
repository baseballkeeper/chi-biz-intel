
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DATASET_URL =
  "https://data.cityofchicago.org/resource/v6vf-nfxy.json";

const PAGE_SIZE = 1000;
const MAX_RESULTS = 10000;

type RawRow = {
  sr_number?: string;
  sr_type?: string;
  sr_short_code?: string;
  status?: string;
  created_date?: string;
  last_modified_date?: string;
  closed_date?: string;
  street_address?: string;
  street_number?: string;
  street_direction?: string;
  street_name?: string;
  street_type?: string;
  duplicate?: boolean | string;
  community_area?: string;
  ward?: string;
  latitude?: string;
  longitude?: string;
};

const SUFFIXES: Record<string, string> = {
  STREET: "ST",
  AVENUE: "AVE",
  ROAD: "RD",
  BOULEVARD: "BLVD",
  DRIVE: "DR",
  PLACE: "PL",
  COURT: "CT",
  LANE: "LN",
  PARKWAY: "PKWY",
  TERRACE: "TER",
};

function normalizeAddress(value: string): string {
  return value
    .toUpperCase()
    .replace(/[.,]/g, " ")
    .replace(/\bCHICAGO\b/g, " ")
    .replace(/\bILLINOIS\b/g, " ")
    .replace(/\bIL\b/g, " ")
    .replace(/\bNORTH\b/g, "N")
    .replace(/\bSOUTH\b/g, "S")
    .replace(/\bEAST\b/g, "E")
    .replace(/\bWEST\b/g, "W")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) => SUFFIXES[part] || part)
    .join(" ");
}

function escapeSoql(value: string): string {
  return value.replace(/'/g, "''");
}

function coordinate(
  value: string | undefined,
  min: number,
  max: number
): number | null {
  if (!value) return null;

  const number = Number(value);

  return Number.isFinite(number) &&
    number >= min &&
    number <= max
    ? number
    : null;
}

async function fetchPage(
  where: string,
  offset: number
): Promise<RawRow[]> {
  const query = `
    SELECT
      sr_number,
      sr_type,
      sr_short_code,
      status,
      created_date,
      last_modified_date,
      closed_date,
      street_address,
      street_number,
      street_direction,
      street_name,
      street_type,
      duplicate,
      community_area,
      ward,
      latitude,
      longitude
    WHERE ${where}
    ORDER BY created_date DESC, sr_number DESC
    LIMIT ${PAGE_SIZE}
    OFFSET ${offset}
  `
    .replace(/\s+/g, " ")
    .trim();

  const url =
    `${DATASET_URL}?$query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    next: { revalidate: 900 },
    headers: {
      "User-Agent": "MetroSift/1.0",
    },
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);

    throw new Error(
      `Chicago 311 returned ${response.status}: ${details}`
    );
  }

  return (await response.json()) as RawRow[];
}

export async function GET(request: Request) {
  const address = (
    new URL(request.url).searchParams.get("address") || ""
  ).trim();

  if (
    address.length < 5 ||
    address.length > 150 ||
    !/^\d+\s+/.test(address)
  ) {
    return NextResponse.json(
      {
        error:
          "Enter a Chicago street address including its street number.",
      },
      { status: 400 }
    );
  }

  const target = normalizeAddress(address)
    .replace(/\s+\d{5}$/, "");

  const parts = target.split(" ");

  if (
    parts.length < 3 ||
    !/^\d+[A-Z]?$/.test(parts[0]) ||
    !["N", "S", "E", "W"].includes(parts[1]) ||
    !/^[A-Z0-9 ]+$/.test(target)
  ) {
    return NextResponse.json(
      {
        error:
          "Enter a valid address with a street number and direction.",
      },
      { status: 400 }
    );
  }

  const streetNumber = parts[0];
  const streetDirection = parts[1];

  // Query the structured street components rather
  // than relying solely on formatted addresses.
  const where = `
    street_number = '${escapeSoql(streetNumber)}'
    AND upper(street_direction) = '${escapeSoql(streetDirection)}'
  `;

  try {
    const records: RawRow[] = [];
    let complete = false;

    for (
      let offset = 0;
      offset < MAX_RESULTS;
      offset += PAGE_SIZE
    ) {
      const page = await fetchPage(where, offset);
      records.push(...page);

      if (page.length < PAGE_SIZE) {
        complete = true;
        break;
      }
    }

    if (!complete) {
      const extra = await fetchPage(where, MAX_RESULTS);
      complete = extra.length === 0;
    }

    // The broad query retrieves matching house numbers
    // and directions. This second check ensures we only
    // retain the requested street.
    const matched = records.filter(
      (row) =>
        normalizeAddress(row.street_address || "") === target
    );

    const formatted = matched.map((row) => ({
      requestNumber: row.sr_number || "",
      type: row.sr_type || "Unknown",
      shortCode: row.sr_short_code || "",
      status: row.status || "Unknown",
      createdDate: row.created_date || "",
      modifiedDate: row.last_modified_date || "",
      closedDate: row.closed_date || "",
      address: row.street_address || "",
      duplicate:
        row.duplicate === true ||
        row.duplicate === "true",
      communityArea: row.community_area || "",
      ward: row.ward || "",
      latitude: coordinate(row.latitude, -90, 90),
      longitude: coordinate(row.longitude, -180, 180),
    }));

    const typeCounts = new Map<string, number>();
    const statusCounts = new Map<string, number>();

    for (const record of formatted) {
      typeCounts.set(
        record.type,
        (typeCounts.get(record.type) || 0) + 1
      );

      statusCounts.set(
        record.status,
        (statusCounts.get(record.status) || 0) + 1
      );
    }

    return NextResponse.json({
      address,
      normalizedAddress: target,
      summary: {
        totalRequests: formatted.length,
        duplicateRequests: formatted.filter(
          (record) => record.duplicate
        ).length,
        byType: [...typeCounts.entries()]
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
        byStatus: [...statusCounts.entries()]
          .map(([status, count]) => ({ status, count }))
          .sort((a, b) => b.count - a.count),
      },
      records: formatted,
      complete,
      candidatesScanned: records.length,
      refreshedAt: new Date().toISOString(),
      note:
        "311 records are service requests, not confirmed violations. " +
        "A request may concern nearby public infrastructure rather " +
        "than the property itself. Results are matched by the " +
        "reported street address.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to retrieve Chicago 311 records",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 502 }
    );
  }
}

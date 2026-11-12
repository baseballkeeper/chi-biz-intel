
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DATASET_URL =
  "https://data.cityofchicago.org/resource/7nii-7srd.json";

const PAGE_SIZE = 1000;
const MAX_RESULTS = 10000;

type RawVacancy = {
  service_request_number?: string;
  service_request_type?: string;
  date_service_request_was_received?: string;
  address_street_number?: string;
  address_street_direction?: string;
  address_street_name?: string;
  address_street_suffix?: string;
  is_the_building_currently_vacant_or_occupied_?: string;
  is_building_open_or_boarded_?: string;
  is_the_building_dangerous_or_hazardous_?: string;
  is_the_building_vacant_due_to_fire_?: boolean | string;
  location_of_building_on_the_lot_if_garage_change_type_code_to_bgd_?: string;
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

function soqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

function validCoordinate(
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
): Promise<RawVacancy[]> {
  const query = `
    SELECT *
    WHERE ${where}
    ORDER BY date_service_request_was_received DESC,
             service_request_number DESC
    LIMIT ${PAGE_SIZE}
    OFFSET ${offset}
  `
    .replace(/\s+/g, " ")
    .trim();

  const url =
    `${DATASET_URL}?$query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    next: { revalidate: 3600 },
    headers: {
      "User-Agent": "MetroSift/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Chicago vacancy dataset returned ${response.status}`
    );
  }

  return (await response.json()) as RawVacancy[];
}

export async function GET(request: Request) {
  const address = (
    new URL(request.url).searchParams.get("address") || ""
  ).trim();

  const normalized = normalizeAddress(address);
  const parts = normalized.split(" ");

  if (
    address.length < 5 ||
    address.length > 150 ||
    parts.length < 4 ||
    !/^\d+[A-Z]?$/.test(parts[0]) ||
    !["N", "S", "E", "W"].includes(parts[1])
  ) {
    return NextResponse.json(
      {
        error:
          "Enter a Chicago street address including number and direction.",
      },
      { status: 400 }
    );
  }

  const streetNumber = parts[0];
  const direction = parts[1];
  const suffix = parts[parts.length - 1];
  const streetName = parts.slice(2, -1).join(" ");

  if (!streetName || !suffix) {
    return NextResponse.json(
      { error: "Invalid street address." },
      { status: 400 }
    );
  }

  const where = `
    address_street_number = '${soqlEscape(streetNumber)}'
    AND address_street_direction = '${soqlEscape(direction)}'
    AND upper(address_street_name) = '${soqlEscape(streetName)}'
  `;

  try {
    const candidates: RawVacancy[] = [];
    let complete = false;

    for (
      let offset = 0;
      offset < MAX_RESULTS;
      offset += PAGE_SIZE
    ) {
      const page = await fetchPage(where, offset);
      candidates.push(...page);

      if (page.length < PAGE_SIZE) {
        complete = true;
        break;
      }
    }

    if (!complete) {
      const extra = await fetchPage(where, MAX_RESULTS);
      complete = extra.length === 0;
    }

    const matched = candidates.filter((record) => {
      const recordedAddress = [
        record.address_street_number,
        record.address_street_direction,
        record.address_street_name,
        record.address_street_suffix,
      ]
        .filter(Boolean)
        .join(" ");

      return normalizeAddress(recordedAddress) === normalized;
    });

    const records = matched.map((record) => ({
      requestNumber: record.service_request_number || "",
      type:
        record.service_request_type ||
        "Vacant/Abandoned Building",
      date:
        record.date_service_request_was_received || "",
      address: [
        record.address_street_number,
        record.address_street_direction,
        record.address_street_name,
        record.address_street_suffix,
      ]
        .filter(Boolean)
        .join(" "),
      reportedOccupancy:
        record.is_the_building_currently_vacant_or_occupied_ ||
        "Not reported",
      openOrBoarded:
        record.is_building_open_or_boarded_ || "Not reported",
      reportedHazard:
        record.is_the_building_dangerous_or_hazardous_ ||
        "Not reported",
      fireRelated:
        record.is_the_building_vacant_due_to_fire_ === true ||
        record.is_the_building_vacant_due_to_fire_ === "true",
      buildingLocation:
        record.location_of_building_on_the_lot_if_garage_change_type_code_to_bgd_ ||
        "",
      latitude: validCoordinate(record.latitude, -90, 90),
      longitude: validCoordinate(record.longitude, -180, 180),
      source: "historical-311" as const,
    }));

    return NextResponse.json({
      address,
      normalizedAddress: normalized,
      summary: {
        historicalReports: records.length,
        reportedVacant: records.filter(
          (record) =>
            record.reportedOccupancy.toLowerCase() === "vacant"
        ).length,
        reportedOccupied: records.filter(
          (record) =>
            record.reportedOccupancy.toLowerCase() === "occupied"
        ).length,
      },
      records,
      complete,
      candidatesScanned: candidates.length,
      refreshedAt: new Date().toISOString(),
      note:
        "Historical 311 reports reflect conditions reported at the time. " +
        "They do not establish whether a property is currently vacant, " +
        "occupied, dangerous, or otherwise in violation.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to retrieve historical vacancy reports.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 502 }
    );
  }
}

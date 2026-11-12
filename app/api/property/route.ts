
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE_URL = "https://data.cityofchicago.org/resource";

const DATASETS = {
  violations: "22u3-xenr",
  permits: "ydr8-5enu",
  licenses: "uupf-x98q",
  inspections: "4ijn-s7e5",
};

const PAGE_SIZE = 1000;
const MAX_RESULTS = 10000;

type RawRow = Record<string, string | undefined>;

const STREET_SUFFIXES: Record<string, string[]> = {
  ST: ["ST", "STREET"],
  AVE: ["AVE", "AVENUE"],
  RD: ["RD", "ROAD"],
  BLVD: ["BLVD", "BOULEVARD"],
  DR: ["DR", "DRIVE"],
  PL: ["PL", "PLACE"],
  CT: ["CT", "COURT"],
  LN: ["LN", "LANE"],
  PKWY: ["PKWY", "PARKWAY"],
  TER: ["TER", "TERRACE"],
};

const SUFFIX_LOOKUP = new Map<string, string>();

for (const [canonical, variants] of Object.entries(
  STREET_SUFFIXES
)) {
  for (const variant of variants) {
    SUFFIX_LOOKUP.set(variant, canonical);
  }
}

function normalizeAddress(value: string): string {
  let normalized = value
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
    .trim();

  const parts = normalized.split(" ");

  // Normalize street suffixes without changing words
  // that merely contain the same letters.
  normalized = parts
    .map((part) => SUFFIX_LOOKUP.get(part) || part)
    .join(" ");

  return normalized;
}

function escapeSoql(value: string): string {
  return value.replace(/'/g, "''");
}

function escapeLike(value: string): string {
  return escapeSoql(value)
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

function coordinate(
  value: string | undefined,
  min: number,
  max: number
): number | null {
  if (!value?.trim()) return null;

  const number = Number(value);

  return Number.isFinite(number) &&
    number >= min &&
    number <= max
    ? number
    : null;
}

function streetVariants(street: string): string[] {
  const parts = street.split(" ");
  const last = parts[parts.length - 1];
  const alternatives = STREET_SUFFIXES[last];

  if (!alternatives) return [street];

  const prefix = parts.slice(0, -1).join(" ");

  return [...new Set(
    alternatives.map((suffix) =>
      [prefix, suffix].filter(Boolean).join(" ")
    )
  )];
}

function addressVariants(target: string): string[] {
  const parts = target.split(" ");
  const prefix = parts.slice(0, 2).join(" ");
  const street = parts.slice(2).join(" ");

  return streetVariants(street).map(
    (variant) => `${prefix} ${variant}`
  );
}

function matchesAddress(
  recordedAddress: string,
  target: string,
  allowUnitSuffix = false
): boolean {
  const normalized = normalizeAddress(recordedAddress);

  if (normalized === target) return true;
  if (!allowUnitSuffix) return false;

  if (!normalized.startsWith(`${target} `)) {
    return false;
  }

  const suffix = normalized
    .slice(target.length)
    .trim();

  // Preserve the original unit-matching behavior.
  // Address matching remains anchored to the
  // complete street address and a space.
  return /^(?:(?:UNIT|STE|SUITE|APT|APARTMENT|FL|FLOOR|#)\s*)?[A-Z0-9]+(?:[-/][A-Z0-9]+)*$/.test(
    suffix
  );
}

async function fetchRows(
  dataset: string,
  query: string
): Promise<RawRow[]> {
  const url =
    `${BASE_URL}/${dataset}.json?` +
    `$query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    next: { revalidate: 900 },
    headers: {
      "User-Agent": "MetroSift/1.0",
    },
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 1000);

    throw new Error(
      `Dataset ${dataset} returned ${response.status}: ${details}`
    );
  }

  return (await response.json()) as RawRow[];
}

async function fetchAll(
  dataset: string,
  select: string,
  where: string,
  order: string
) {
  const rows: RawRow[] = [];
  let complete = false;

  for (
    let offset = 0;
    offset < MAX_RESULTS;
    offset += PAGE_SIZE
  ) {
    const query = `
      ${select}
      WHERE ${where}
      ORDER BY ${order}
      LIMIT ${PAGE_SIZE}
      OFFSET ${offset}
    `
      .replace(/\s+/g, " ")
      .trim();

    const page = await fetchRows(dataset, query);
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      complete = true;
      break;
    }
  }

  if (!complete) {
    const checkQuery = `
      ${select}
      WHERE ${where}
      ORDER BY ${order}
      LIMIT 1
      OFFSET ${MAX_RESULTS}
    `
      .replace(/\s+/g, " ")
      .trim();

    const extra = await fetchRows(dataset, checkQuery);
    complete = extra.length === 0;
  }

  return {
    rows,
    complete,
    limited: !complete,
    candidatesScanned: rows.length,
  };
}

function formatViolation(row: RawRow) {
  return {
    id: row.id || "",
    date: row.violation_date || "",
    code: row.violation_code || "",
    status: row.violation_status || "",
    description: row.violation_description || "",
    inspectorComments:
      row.violation_inspector_comments || "",
    inspectionStatus: row.inspection_status || "",
    address: row.address || "",
    propertyGroup: row.property_group || "",
    latitude: coordinate(row.latitude, -90, 90),
    longitude: coordinate(row.longitude, -180, 180),
  };
}

function formatPermit(row: RawRow) {
  const address = [
    row.street_number,
    row.street_direction,
    row.street_name,
  ]
    .filter(Boolean)
    .join(" ");

  const cost =
    row.reported_cost?.trim() &&
    Number.isFinite(Number(row.reported_cost))
      ? Number(row.reported_cost)
      : null;

  return {
    permitNumber: row.permit_ || "",
    permitType: row.permit_type || "",
    permitStatus: row.permit_status || "",
    permitMilestone: row.permit_milestone || "",
    reviewType: row.review_type || "",
    applicationStartDate:
      row.application_start_date || "",
    issueDate: row.issue_date || "",
    address,
    workDescription: row.work_description || "",
    reportedCost: cost,
    communityArea: row.community_area || "",
    latitude: coordinate(row.latitude, -90, 90),
    longitude: coordinate(row.longitude, -180, 180),
  };
}

function formatLicense(row: RawRow, target: string) {
  return {
    licenseId: row.license_id || "",
    licenseNumber: row.license_number || "",
    legalName: row.legal_name || "",
    businessName:
      row.doing_business_as_name ||
      row.legal_name ||
      "Unknown business",
    address: row.address || "",
    addressMatch:
      normalizeAddress(row.address || "") === target
        ? "exact"
        : "unit_suffix",
    licenseDescription: row.license_description || "",
    businessActivity: row.business_activity || "",
    applicationType: row.application_type || "",
    dateIssued: row.date_issued || "",
    licenseStartDate: row.license_start_date || "",
    licenseStatus: row.license_status || "",
    zipCode: row.zip_code || "",
    latitude: coordinate(row.latitude, -90, 90),
    longitude: coordinate(row.longitude, -180, 180),
  };
}

function formatInspection(row: RawRow, target: string) {
  return {
    inspectionId: row.inspection_id || "",
    businessName: row.dba_name || "",
    alternateName: row.aka_name || "",
    licenseNumber: row.license_ || "",
    facilityType: row.facility_type || "",
    risk: row.risk || "",
    address: row.address || "",
    addressMatch:
      normalizeAddress(row.address || "") === target
        ? "exact"
        : "unit_suffix",
    inspectionDate: row.inspection_date || "",
    inspectionType: row.inspection_type || "",
    results: row.results || "",
    violations: row.violations || "",
    latitude: coordinate(row.latitude, -90, 90),
    longitude: coordinate(row.longitude, -180, 180),
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const address = (params.get("address") || "").trim();

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

  const normalized = normalizeAddress(address);
  const target = normalized.replace(/\s+\d{5}$/, "");
  const parts = target.split(" ");

  if (
    parts.length < 3 ||
    !/^\d+[A-Z]?$/.test(parts[0]) ||
    !/^[A-Z0-9 ]+$/.test(target)
  ) {
    return NextResponse.json(
      { error: "Invalid street address" },
      { status: 400 }
    );
  }

  if (!["N", "S", "E", "W"].includes(parts[1])) {
    return NextResponse.json(
      {
        error:
          "Include a street direction (N, S, E, or W).",
      },
      { status: 400 }
    );
  }

  const streetNumber = parts[0];
  const streetDirection = parts[1];
  const streetName = parts.slice(2).join(" ");

  const variants = addressVariants(target);
  const permitStreetVariants = streetVariants(streetName);

  const addressWhere = `(${variants
    .map((variant) => {
      const exact = escapeSoql(variant);
      const prefix = escapeLike(variant);

      return `(
        upper(address) = '${exact}'
        OR upper(address) LIKE '${prefix} %'
      )`;
    })
    .join(" OR ")})`;

  const safeNumber = escapeSoql(streetNumber);
  const safeDirection = escapeSoql(streetDirection);

  const permitWhere = `
    street_number = '${safeNumber}'
    AND upper(street_direction) = '${safeDirection}'
    AND (${permitStreetVariants
      .map((variant) => {
        const exact = escapeSoql(variant);
        const prefix = escapeLike(variant);

        return `(
          upper(street_name) = '${exact}'
          OR upper(street_name) LIKE '${prefix} %'
        )`;
      })
      .join(" OR ")})
  `;

  const violationSelect = `
    SELECT
      id,
      violation_date,
      violation_code,
      violation_status,
      violation_description,
      violation_inspector_comments,
      inspection_status,
      address,
      property_group,
      latitude,
      longitude
  `;

  const permitSelect = `
    SELECT
      permit_,
      permit_type,
      permit_status,
      permit_milestone,
      review_type,
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
  `;

  const licenseSelect = `
    SELECT
      license_id,
      license_number,
      legal_name,
      doing_business_as_name,
      address,
      zip_code,
      license_description,
      business_activity,
      application_type,
      date_issued,
      license_start_date,
      license_status,
      latitude,
      longitude
  `;

  const inspectionSelect = `
    SELECT
      inspection_id,
      dba_name,
      aka_name,
      license_,
      facility_type,
      risk,
      address,
      inspection_date,
      inspection_type,
      results,
      violations,
      latitude,
      longitude
  `;

  try {
    const [
      violationResult,
      permitResult,
      licenseResult,
      inspectionResult,
    ] = await Promise.all([
      fetchAll(
        DATASETS.violations,
        violationSelect,
        addressWhere,
        "violation_date DESC, id DESC"
      ),
      fetchAll(
        DATASETS.permits,
        permitSelect,
        permitWhere,
        "application_start_date DESC, permit_ DESC"
      ),
      fetchAll(
        DATASETS.licenses,
        licenseSelect,
        addressWhere,
        "date_issued DESC, license_id DESC"
      ),
      fetchAll(
        DATASETS.inspections,
        inspectionSelect,
        addressWhere,
        "inspection_date DESC, inspection_id DESC"
      ),
    ]);

    const violations = violationResult.rows
      .filter((row) =>
        matchesAddress(row.address || "", target)
      )
      .map(formatViolation);

    const permits = permitResult.rows
      .filter((row) => {
        const permitAddress = [
          row.street_number,
          row.street_direction,
          row.street_name,
        ]
          .filter(Boolean)
          .join(" ");

        return matchesAddress(permitAddress, target);
      })
      .map(formatPermit);

    const licenses = licenseResult.rows
      .filter((row) =>
        matchesAddress(row.address || "", target, true)
      )
      .map((row) => formatLicense(row, target));

    const inspections = inspectionResult.rows
      .filter((row) =>
        matchesAddress(row.address || "", target, true)
      )
      .map((row) => formatInspection(row, target));

    const complete =
      violationResult.complete &&
      permitResult.complete &&
      licenseResult.complete &&
      inspectionResult.complete;

    return NextResponse.json({
      address,
      normalizedAddress: target,

      summary: {
        buildingViolations: violations.length,
        buildingPermits: permits.length,
        businessLicenses: licenses.length,
        foodInspections: inspections.length,
      },

      violations: {
        source: {
          dataset: DATASETS.violations,
          name: "Chicago Building Violations",
        },
        count: violations.length,
        candidatesScanned:
          violationResult.candidatesScanned,
        complete: violationResult.complete,
        limited: violationResult.limited,
        records: violations,
      },

      permits: {
        source: {
          dataset: DATASETS.permits,
          name: "Chicago Building Permits",
        },
        count: permits.length,
        candidatesScanned:
          permitResult.candidatesScanned,
        complete: permitResult.complete,
        limited: permitResult.limited,
        records: permits,
      },

      licenses: {
        source: {
          dataset: DATASETS.licenses,
          name: "Chicago Business Licenses",
        },
        count: licenses.length,
        candidatesScanned:
          licenseResult.candidatesScanned,
        complete: licenseResult.complete,
        limited: licenseResult.limited,
        records: licenses,
      },

      inspections: {
        source: {
          dataset: DATASETS.inspections,
          name: "Chicago Food Inspections",
        },
        count: inspections.length,
        candidatesScanned:
          inspectionResult.candidatesScanned,
        complete: inspectionResult.complete,
        limited: inspectionResult.limited,
        records: inspections,
      },

      complete,
      refreshedAt: new Date().toISOString(),

      note:
        "Records are matched by normalized street address. " +
        "Common street suffix variants are searched. " +
        "Business licenses and food inspections may include unit suffixes. " +
        "Counts represent records, not unique businesses or properties. " +
        "Food inspection outcomes refer to individual establishments. " +
        "Completeness applies to queried address formats, " +
        "not every possible historical address variant. " +
        "Source status codes are preserved without interpretation.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Property lookup failed",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 502 }
    );
  }
}

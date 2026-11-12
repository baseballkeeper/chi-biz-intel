"use client";

import { useEffect, useMemo, useState } from "react";

type Violation = {
  id: string;
  date: string;
  code: string;
  status: string;
  description: string;
  inspectorComments: string;
  inspectionStatus: string;
};

type Permit = {
  permitNumber: string;
  permitType: string;
  permitStatus: string;
  applicationStartDate: string;
  issueDate: string;
  workDescription: string;
  reportedCost: number | null;
};

type License = {
  licenseId: string;
  businessName: string;
  address: string;
  licenseDescription: string;
  applicationType: string;
  dateIssued: string;
  licenseStatus: string;
};

type Inspection = {
  inspectionId: string;
  businessName: string;
  inspectionDate: string;
  inspectionType: string;
  results: string;
  violations: string;
};

type ServiceRequest = {
  requestNumber: string;
  type: string;
  shortCode: string;
  status: string;
  createdDate: string;
  modifiedDate: string;
  closedDate: string;
  address: string;
  duplicate: boolean;
  communityArea: string;
  ward: string;
  latitude: number | null;
  longitude: number | null;
};

type ServiceRequestData = {
  summary: {
    totalRequests: number;
    duplicateRequests: number;
  };
  records: ServiceRequest[];
  complete: boolean;
  note: string;
};

type PropertyData = {
  address: string;
  summary: {
    buildingViolations: number;
    buildingPermits: number;
    businessLicenses: number;
    foodInspections: number;
  };
  violations: { records: Violation[] };
  permits: { records: Permit[] };
  licenses: { records: License[] };
  inspections: { records: Inspection[] };
  complete: boolean;
  refreshedAt: string;
  note: string;
};

type Category =
  | "violation"
  | "permit"
  | "license"
  | "inspection"
  | "311";

type TimelineItem = {
  id: string;
  category: Category;
  date: string;
  title: string;
  subtitle: string;
  status: string;
  details: string;
  metadata: string[];
};

const categories: {
  id: Category | "all";
  label: string;
}[] = [
  { id: "all", label: "All activity" },
  { id: "violation", label: "Violations" },
  { id: "permit", label: "Permits" },
  { id: "license", label: "Licenses" },
  { id: "inspection", label: "Food inspections" },
  { id: "311", label: "311 requests" },
];

function formatDate(value: string): string {
  if (!value) return "Date unavailable";

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value: number | null): string {
  if (value === null) return "Not reported";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function categoryLabel(category: Category): string {
  switch (category) {
    case "violation":
      return "Building violation";
    case "permit":
      return "Building permit";
    case "license":
      return "Business license";
    case "inspection":
      return "Food inspection";
    case "311":
      return "311 service request";
  }
}

function categoryStyle(category: Category): string {
  switch (category) {
    case "violation":
      return "bg-rose-50 text-rose-700";
    case "permit":
      return "bg-blue-50 text-blue-700";
    case "license":
      return "bg-violet-50 text-violet-700";
    case "inspection":
      return "bg-amber-50 text-amber-700";
    case "311":
      return "bg-teal-50 text-teal-700";
  }
}

function buildTimeline(data: PropertyData, requests: ServiceRequestData | null): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const record of data.violations.records) {
    items.push({
      id: `violation-${record.id}`,
      category: "violation",
      date: record.date,
      title: record.description || "Building violation",
      subtitle: `Violation ${record.code || record.id}`,
      status: record.status,
      details:
        record.inspectorComments ||
        "No inspector comments available.",
      metadata: [
        `Violation ID: ${record.id}`,
        `Inspection result: ${record.inspectionStatus || "Not reported"}`,
      ],
    });
  }

  for (const record of data.permits.records) {
    items.push({
      id: `permit-${record.permitNumber}`,
      category: "permit",
      date:
        record.applicationStartDate ||
        record.issueDate,
      title: record.permitType || "Building permit",
      subtitle: `Permit ${record.permitNumber}`,
      status: record.permitStatus || "Not reported",
      details:
        record.workDescription ||
        "No work description available.",
      metadata: [
        `Application: ${formatDate(record.applicationStartDate)}`,
        `Issued: ${formatDate(record.issueDate)}`,
        `Reported cost: ${formatMoney(record.reportedCost)}`,
      ],
    });
  }

  for (const record of data.licenses.records) {
    items.push({
      id: `license-${record.licenseId}`,
      category: "license",
      date: record.dateIssued,
      title: record.businessName || "Business license",
      subtitle:
        record.licenseDescription ||
        `License ${record.licenseId}`,
      status: record.applicationType || "Not reported",
      details:
        `License status code: ${record.licenseStatus || "Not reported"}`,
      metadata: [
        `License ID: ${record.licenseId}`,
        `Recorded address: ${record.address}`,
      ],
    });
  }

  for (const record of data.inspections.records) {
    items.push({
      id: `inspection-${record.inspectionId}`,
      category: "inspection",
      date: record.inspectionDate,
      title: record.businessName || "Food inspection",
      subtitle:
        record.inspectionType ||
        `Inspection ${record.inspectionId}`,
      status: record.results || "Not reported",
      details:
        record.violations ||
        "No violation details reported.",
      metadata: [
        `Inspection ID: ${record.inspectionId}`,
      ],
    });
  }

  for (const record of requests?.records ?? []) {
    items.push({
      id: `311-${record.requestNumber}`,
      category: "311",
      date: record.createdDate,
      title: record.type || "311 service request",
      subtitle: `Request ${record.requestNumber}`,
      status: record.status || "Not reported",
      details: "This is a reported service request, not a verified property violation. The request may concern public infrastructure or services associated with this address.",
      metadata: [
        `Request number: ${record.requestNumber}`,
        `Recorded address: ${record.address || "Not reported"}`,
        `Closed: ${formatDate(record.closedDate)}`,
        `Duplicate flag: ${record.duplicate ? "Yes" : "No"}`,
        `Ward: ${record.ward || "Not reported"}`,
      ],
    });
  }

  return items.sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

export default function PropertyPage() {
  const [address, setAddress] = useState(
    "1601 N Milwaukee Ave"
  );
  const [searchedAddress, setSearchedAddress] = useState(
    "1601 N Milwaukee Ave"
  );
  const [data, setData] = useState<PropertyData | null>(
    null
  );
  const [requests, setRequests] = useState<ServiceRequestData | null>(null);
  const [requestsError, setRequestsError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<
    Category | "all"
  >("all");
  const [expanded, setExpanded] = useState<
    string | null
  >(null);
  const [visibleCount, setVisibleCount] = useState(25);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProperty() {
      setLoading(true);
      setError("");
      setData(null);
      setRequests(null);
      setRequestsError("");

      try {
        const query = encodeURIComponent(searchedAddress);
        const [propertyResult, requestsResult] = await Promise.allSettled([
          fetch(`/api/property?address=${query}`, { signal: controller.signal })
            .then(async (response) => {
              const body = await response.json();
              if (!response.ok) {
                throw new Error(body.error || "Unable to load property records.");
              }
              return body as PropertyData;
            }),
          fetch(`/api/property-311?address=${query}`, { signal: controller.signal })
            .then(async (response) => {
              const body = await response.json();
              if (!response.ok) {
                throw new Error(body.error || "Unable to load 311 requests.");
              }
              return body as ServiceRequestData;
            }),
        ]);

        if (controller.signal.aborted) return;
        if (propertyResult.status === "rejected") {
          throw propertyResult.reason;
        }
        setData(propertyResult.value);

        if (requestsResult.status === "fulfilled") {
          setRequests(requestsResult.value);
        } else {
          setRequestsError("311 requests are temporarily unavailable. Other property records are still shown.");
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProperty();

    return () => controller.abort();
  }, [searchedAddress]);

  const timeline = useMemo(
    () => (data ? buildTimeline(data, requests) : []),
    [data, requests]
  );

  const filteredTimeline = useMemo(
    () =>
      filter === "all"
        ? timeline
        : timeline.filter(
            (item) => item.category === filter
          ),
    [timeline, filter]
  );

  const visibleTimeline = filteredTimeline.slice(
    0,
    visibleCount
  );

  function searchProperty(event: React.FormEvent) {
    event.preventDefault();

    const nextAddress = address.trim();

    if (!nextAddress) return;

    setFilter("all");
    setExpanded(null);
    setVisibleCount(25);
    setSearchedAddress(nextAddress);
  }

  function selectFilter(nextFilter: Category | "all") {
    setFilter(nextFilter);
    setExpanded(null);
    setVisibleCount(25);
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <a
            href="/"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            &larr; Back to MetroSift
          </a>

          <p className="mt-10 text-sm font-semibold uppercase tracking-widest text-blue-700">
            MetroSift / Property Intelligence
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Explore the history of a Chicago property.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Search an address to explore building permits,
            code violations, business licenses, food
            inspections, and 311 service requests in one place.
          </p>

          <form
            onSubmit={searchProperty}
            className="mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={address}
              onChange={(event) =>
                setAddress(event.target.value)
              }
              placeholder="1601 N Milwaukee Ave"
              aria-label="Chicago street address"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search property"}
            </button>
          </form>

          <p className="mt-3 text-sm text-slate-500">
            Include the street number and direction, such as
            1601 N Milwaukee Ave.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-600">
            Retrieving Chicago property records...
          </div>
        )}

        {error && !loading && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"
          >
            <h2 className="font-semibold">
              Property lookup failed
            </h2>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}

        {data && !loading && (
          <>
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Property results
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                {data.address}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {data.complete
                  ? "All matching property query results retrieved"
                  : "Some source results may be incomplete"}
                {" | "} Updated {formatDate(data.refreshedAt)}
              </p>
            </div>

            {requestsError && (
              <p role="status" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {requestsError}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "Building violations",
                  value: data.summary.buildingViolations,
                  category: "violation" as const,
                },
                {
                  label: "Building permits",
                  value: data.summary.buildingPermits,
                  category: "permit" as const,
                },
                {
                  label: "Business licenses",
                  value: data.summary.businessLicenses,
                  category: "license" as const,
                },
                {
                  label: "Food inspections",
                  value: data.summary.foodInspections,
                  category: "inspection" as const,
                },
                {
                  label: "311 requests",
                  value: requests?.summary.totalRequests ?? null,
                  category: "311" as const,
                },
              ].map((item) => (
                <button
                  key={item.category}
                  type="button"
                  onClick={() =>
                    selectFilter(item.category)
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md"
                >
                  <p className="text-sm font-medium text-slate-600">
                    {item.label}
                  </p>
                  <p className="mt-3 text-4xl font-bold tracking-tight">
                    {item.value === null ? "Unavailable" : item.value.toLocaleString()}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-blue-700">
                    View records &rarr;
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-12">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Property activity timeline
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    {filteredTimeline.length.toLocaleString()}{" "}
                    matching records, newest first.
                    {requests && !requests.complete && " 311 results may be incomplete."}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      selectFilter(category.id)
                    }
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      filter === category.id
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {filteredTimeline.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-sm text-slate-600">
                  No matching records found in this category.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {visibleTimeline.map((item) => {
                    const isExpanded =
                      expanded === item.id;

                    return (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded(
                              isExpanded ? null : item.id
                            )
                          }
                          aria-expanded={isExpanded}
                          className="w-full p-5 text-left transition hover:bg-slate-50"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryStyle(item.category)}`}
                                >
                                  {categoryLabel(item.category)}
                                </span>

                                <span className="text-xs text-slate-500">
                                  {formatDate(item.date)}
                                </span>
                              </div>

                              <h3 className="mt-3 font-semibold text-slate-900">
                                {item.title}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                {item.subtitle}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              {item.status && (
                                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                  {item.status}
                                </span>
                              )}

                              <span className="text-sm font-semibold text-blue-700">
                                {isExpanded
                                  ? "Hide details"
                                  : "Details"}
                              </span>
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50 p-5">
                            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                              {item.details}
                            </p>

                            <div className="mt-5 space-y-2 border-t border-slate-200 pt-4">
                              {item.metadata.map(
                                (entry, index) => (
                                  <p
                                    key={`${item.id}-${index}`}
                                    className="text-xs text-slate-500"
                                  >
                                    {entry}
                                  </p>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {visibleCount < filteredTimeline.length && (
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount(
                        (count) => count + 25
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    Load more records
                  </button>
                </div>
              )}
            </div>

            <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold">
                About these records
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {data.note}
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Building permit costs are reported
                estimates and may overlap across
                amendments. Inspection outcomes refer
                to individual establishments. Records
                do not establish property ownership,
                current occupancy, or the complete
                history of a building.
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                311 requests are public reports and do not establish that a violation occurred.
                Some refer to nearby streets, infrastructure, businesses, or services.
                {requests && ` ${requests.summary.duplicateRequests.toLocaleString()} requests are flagged as duplicates by the city.`}
                {requests && !requests.complete && " The 311 search reached its retrieval limit; its count may be understated."}
              </p>

              <a
                href="https://data.cityofchicago.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                City of Chicago Open Data Portal &nearr;
              </a>
            </div>
          </>
        )}
      </section>
    </main>
  );
}


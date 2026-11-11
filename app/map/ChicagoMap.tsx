
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type {
  Feature,
  FeatureCollection,
  Geometry,
} from "geojson";
import "leaflet/dist/leaflet.css";

type Layer = "communities" | "neighborhoods";

type Properties = {
  community?: string;
  area_numbe?: string | number;
  pri_neigh?: string;
  sec_neigh?: string;
};

type AreaFeature = Feature<Geometry, Properties>;
type AreaCollection = FeatureCollection<Geometry, Properties>;

type Permit = {
  permitNumber: string;
  permitType: string;
  permitStatus: string;
  permitMilestone: string;
  applicationStartDate: string;
  issueDate: string;
  address: string;
  workDescription: string;
  reportedCost: number | null;
  communityArea: string;
};

type PermitResponse = {
  count: number;
  limited: boolean;
  permits: Permit[];
  error?: string;
};

const CHICAGO_CENTER: [number, number] = [
  41.8781,
  -87.6298,
];

function getName(
  feature: AreaFeature,
  layer: Layer
): string {
  return layer === "communities"
    ? feature.properties.community ?? "Unknown"
    : feature.properties.pri_neigh ?? "Unknown";
}

function getDetails(
  feature: AreaFeature,
  layer: Layer
): string {
  if (layer === "communities") {
    return `Community Area #${
      feature.properties.area_numbe ?? "Unknown"
    }`;
  }

  return feature.properties.sec_neigh
    ? `Source grouping: ${feature.properties.sec_neigh}`
    : "Approximate neighborhood boundary";
}

function getCommunityArea(
  feature: AreaFeature | null,
  layer: Layer
): string | null {
  if (!feature || layer !== "communities") {
    return null;
  }

  const value = Number(feature.properties.area_numbe);

  if (!Number.isInteger(value) || value < 1 || value > 77) {
    return null;
  }

  return String(value);
}

function formatDate(value: string): string {
  if (!value) return "Not available";

  const parts = value.slice(0, 10).split("-");

  if (parts.length !== 3) {
    return value.slice(0, 10);
  }

  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

function formatMoney(value: number | null): string {
  if (value === null) return "Not reported";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function MapController({
  data,
  selected,
}: {
  data: AreaCollection | null;
  selected: AreaFeature | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!data?.features.length) return;

    const bounds = L.geoJSON(data).getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [18, 18],
      });
    }
  }, [map, data]);

  useEffect(() => {
    if (!selected) return;

    const bounds = L.geoJSON(selected).getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14,
      });
    }
  }, [map, selected]);

  return null;
}

export default function ChicagoMap() {
  const [layer, setLayer] = useState<Layer>("communities");
  const [data, setData] = useState<AreaCollection | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [permitDays, setPermitDays] = useState(30);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [permitLoading, setPermitLoading] = useState(false);
  const [permitError, setPermitError] = useState("");
  const [permitLimited, setPermitLimited] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadGeography() {
      setLoading(true);
      setError("");
      setData(null);
      setSelectedName("");
      setSearch("");

      try {
        const response = await fetch(
          `/api/geography?layer=${layer}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            `Geography request failed (${response.status})`
          );
        }

        const result = (await response.json()) as AreaCollection;

        if (
          result.type !== "FeatureCollection" ||
          !Array.isArray(result.features)
        ) {
          throw new Error("Invalid GeoJSON response");
        }

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Could not load geography"
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadGeography();

    return () => controller.abort();
  }, [layer]);

  const sortedFeatures = useMemo(() => {
    if (!data) return [];

    return [...data.features].sort((a, b) =>
      getName(a, layer).localeCompare(getName(b, layer))
    );
  }, [data, layer]);

  const selected = useMemo(
    () =>
      sortedFeatures.find(
        (feature) => getName(feature, layer) === selectedName
      ) ?? null,
    [sortedFeatures, selectedName, layer]
  );

  const communityArea = getCommunityArea(selected, layer);

  useEffect(() => {
    const controller = new AbortController();

    if (!communityArea) {
      setPermits([]);
      setPermitError("");
      setPermitLimited(false);
      setPermitLoading(false);

      return () => controller.abort();
    }

    async function loadPermits() {
      setPermitLoading(true);
      setPermitError("");
      setPermits([]);
      setPermitLimited(false);

      try {
        const params = new URLSearchParams({
          area: communityArea!,
          days: String(permitDays),
          status: "all",
          category: "all",
        });

        const response = await fetch(
          `/api/permits?${params.toString()}`,
          { signal: controller.signal }
        );

        const result = (await response.json()) as PermitResponse;

        if (!response.ok) {
          throw new Error(
            result.error ||
              `Permit request failed (${response.status})`
          );
        }

        if (!Array.isArray(result.permits)) {
          throw new Error("Invalid permit response");
        }

        if (!controller.signal.aborted) {
          setPermits(result.permits);
          setPermitLimited(result.limited);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setPermitError(
          err instanceof Error
            ? err.message
            : "Could not load permits"
        );
      } finally {
        if (!controller.signal.aborted) {
          setPermitLoading(false);
        }
      }
    }

    loadPermits();

    return () => controller.abort();
  }, [communityArea, permitDays]);

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return sortedFeatures
      .filter((feature) =>
        getName(feature, layer)
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 12);
  }, [sortedFeatures, search, layer]);

  function selectFeature(feature: AreaFeature) {
    const name = getName(feature, layer);
    setSelectedName(name);
    setSearch(name);
  }

  function clearSelection() {
    setSelectedName("");
    setSearch("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setLayer("communities")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              layer === "communities"
                ? "bg-blue-700 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Community Areas (77)
          </button>

          <button
            type="button"
            onClick={() => setLayer("neighborhoods")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              layer === "neighborhoods"
                ? "bg-blue-700 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Neighborhoods (98)
          </button>
        </div>

        <span className="text-sm text-slate-500">
          {loading
            ? "Loading boundaries..."
            : `${sortedFeatures.length} geographic areas`}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4">
          <label
            htmlFor="geography-search"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Search Chicago
          </label>

          <input
            id="geography-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSelectedName("");
            }}
            placeholder={
              layer === "communities"
                ? "e.g. Logan Square"
                : "e.g. Wicker Park"
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
          />

          {search.trim() && !selected && (
            <div className="mt-3 max-h-60 overflow-y-auto">
              {matches.length ? (
                matches.map((feature, index) => (
                  <button
                    key={`${getName(feature, layer)}-${index}`}
                    type="button"
                    onClick={() => selectFeature(feature)}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50"
                  >
                    {getName(feature, layer)}
                  </button>
                ))
              ) : (
                <p className="py-2 text-sm text-slate-500">
                  No matching areas.
                </p>
              )}
            </div>
          )}

          {selected ? (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Selected location
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {getName(selected, layer)}
              </h2>

              <p className="mt-2 break-words text-sm text-slate-600">
                {getDetails(selected, layer)}
              </p>

              <button
                type="button"
                onClick={clearSelection}
                className="mt-4 text-sm font-medium text-blue-700 hover:underline"
              >
                Clear selection
              </button>

              {communityArea && (
                <div className="mt-6 rounded-lg bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Building permit activity
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {permitLoading
                      ? "Loading..."
                      : permitError
                        ? "Unavailable"
                        : permits.length.toLocaleString()}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Records returned for the selected period
                  </p>

                  {permitLimited && (
                    <p className="mt-2 text-xs text-amber-800">
                      Display limited to the latest 500 records.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h2 className="text-sm font-semibold text-slate-800">
                Explore the map
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Click a boundary on the map or search for a
                location to inspect it.
              </p>
            </div>
          )}

          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            {layer === "communities"
              ? "Official Chicago community areas. Permit activity is filtered using the city's community area field."
              : "Approximate Chicago neighborhood boundaries. Permit filtering for these neighborhoods is not yet available."}
          </div>
        </aside>

        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {error && (
            <div className="absolute left-4 right-4 top-4 z-[1000] rounded-lg bg-red-50 p-3 text-sm text-red-700 shadow">
              {error}
            </div>
          )}

          {loading && (
            <div className="absolute left-4 top-4 z-[1000] rounded-lg bg-white px-3 py-2 text-sm text-slate-600 shadow">
              Loading Chicago boundaries...
            </div>
          )}

          <MapContainer
            center={CHICAGO_CENTER}
            zoom={10}
            zoomControl={true}
            attributionControl={true}
            style={{
              height: "620px",
              width: "100%",
              background: "#e8f0f7",
            }}
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />

            <MapController data={data} selected={selected} />

            {data && (
              <GeoJSON
                key={`${layer}-${selectedName}`}
                data={data}
                style={(feature) => {
                  const area = feature as AreaFeature | undefined;
                  const name = area
                    ? getName(area, layer)
                    : "";

                  const isSelected = name === selectedName;

                  return {
                    color: isSelected
                      ? "#1d4ed8"
                      : "#475569",
                    weight: isSelected ? 3 : 1,
                    fillColor: isSelected
                      ? "#2563eb"
                      : layer === "communities"
                        ? "#93c5fd"
                        : "#86efac",
                    fillOpacity: isSelected ? 0.22 : 0.06,
                  };
                }}
                onEachFeature={(feature, leafletLayer) => {
                  const area = feature as AreaFeature;
                  const name = getName(area, layer);

                  leafletLayer.bindTooltip(name, {
                    sticky: true,
                  });

                  leafletLayer.on("click", () => {
                    selectFeature(area);
                  });
                }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {selected && layer === "neighborhoods" && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {getName(selected, layer)} Activity
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Geographic activity filtering for approximate
            neighborhoods is coming next. We will match
            individual records to neighborhood boundaries
            using their geographic coordinates.
          </p>
        </section>
      )}

      {selected && communityArea && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Geographic Activity Intelligence
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Building Permits — {getName(selected, layer)}
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Recent permit applications assigned to
                Community Area #{communityArea}.
              </p>
            </div>

            <div>
              <label
                htmlFor="permit-period"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Activity period
              </label>

              <select
                id="permit-period"
                value={permitDays}
                onChange={(event) =>
                  setPermitDays(Number(event.target.value))
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 180 days</option>
                <option value={365}>Last 365 days</option>
              </select>
            </div>
          </div>

          {permitLoading && (
            <p className="mt-6 text-sm text-slate-600">
              Loading permit activity...
            </p>
          )}

          {permitError && (
            <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {permitError}
            </div>
          )}

          {!permitLoading && !permitError && (
            <>
              <div className="mt-6 rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {permits.length.toLocaleString()} permit records returned
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Based on application start dates within the
                  selected period. Records may include pending
                  and issued permits.
                </p>

                {permitLimited && (
                  <p className="mt-2 text-xs font-medium text-amber-800">
                    At least 500 records match. Only the 500
                    most recent are displayed.
                  </p>
                )}
              </div>

              {permits.length === 0 ? (
                <p className="mt-6 text-sm text-slate-600">
                  No permit records were returned for this
                  area and period.
                </p>
              ) : (
                <div className="mt-6 space-y-3">
                  {permits.slice(0, 25).map((permit, index) => (
                    <article
                      key={`${permit.permitNumber}-${index}`}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {permit.address || "Address unavailable"}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            {permit.permitType || "Permit type unavailable"}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {permit.permitStatus ||
                            permit.permitMilestone ||
                            "Status unavailable"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                        <div>
                          <span className="font-semibold">
                            Application:
                          </span>{" "}
                          {formatDate(permit.applicationStartDate)}
                        </div>

                        <div>
                          <span className="font-semibold">
                            Reported cost:
                          </span>{" "}
                          {formatMoney(permit.reportedCost)}
                        </div>

                        <div>
                          <span className="font-semibold">
                            Permit:
                          </span>{" "}
                          {permit.permitNumber || "Unavailable"}
                        </div>
                      </div>

                      {permit.workDescription && (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                          {permit.workDescription}
                        </p>
                      )}
                    </article>
                  ))}

                  {permits.length > 25 && (
                    <p className="pt-2 text-center text-sm text-slate-500">
                      Showing the 25 most recent records
                      from {permits.length.toLocaleString()} returned.
                      More detailed browsing will be added later.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

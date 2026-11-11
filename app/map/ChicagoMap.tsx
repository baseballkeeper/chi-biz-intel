
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
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
  latitude?: number | null;
  longitude?: number | null;
};

type PermitResponse = {
  count: number;
  matched?: number;
  limited: boolean;
  permits: Permit[];
  error?: string;
};

type PermitLocation = {
  key: string;
  latitude: number;
  longitude: number;
  permits: Permit[];
};

const CHICAGO_CENTER: [number, number] = [
  41.8781,
  -87.6298,
];

function getName(feature: AreaFeature, layer: Layer): string {
  return layer === "communities"
    ? feature.properties.community ?? "Unknown"
    : feature.properties.pri_neigh ?? "Unknown";
}

function getDetails(feature: AreaFeature, layer: Layer): string {
  if (layer === "communities") {
    return `Community Area #${feature.properties.area_numbe ?? "Unknown"}`;
  }

  return feature.properties.sec_neigh
    ? `Source grouping: ${feature.properties.sec_neigh}`
    : "Approximate neighborhood boundary";
}

function getCommunityArea(
  feature: AreaFeature | null,
  layer: Layer
): string | null {
  if (!feature || layer !== "communities") return null;

  const value = Number(feature.properties.area_numbe);

  return Number.isInteger(value) && value >= 1 && value <= 77
    ? String(value)
    : null;
}

function formatDate(value: string): string {
  if (!value) return "Not available";

  const parts = value.slice(0, 10).split("-");

  return parts.length === 3
    ? `${parts[1]}/${parts[2]}/${parts[0]}`
    : value.slice(0, 10);
}

function formatMoney(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "Not reported";
  }

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
      map.fitBounds(bounds, { padding: [18, 18] });
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
  const [permitCount, setPermitCount] = useState(0);
  const [permitLoading, setPermitLoading] = useState(false);
  const [permitError, setPermitError] = useState("");
  const [permitLimited, setPermitLimited] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);

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
  const selectedLocation = selected
    ? getName(selected, layer)
    : "";

  useEffect(() => {
    const controller = new AbortController();

    if (!selectedLocation) {
      setPermits([]);
      setPermitCount(0);
      setPermitLimited(false);
      setPermitError("");
      setPermitLoading(false);

      return () => controller.abort();
    }

    async function loadPermits() {
      setPermitLoading(true);
      setPermitError("");
      setPermits([]);
      setPermitCount(0);
      setPermitLimited(false);

      try {
        let endpoint: string;

        if (layer === "communities") {
          if (!communityArea) {
            throw new Error("Community area number unavailable");
          }

          const params = new URLSearchParams({
            area: communityArea,
            days: String(permitDays),
            status: "all",
            category: "all",
          });

          endpoint = `/api/permits?${params.toString()}`;
        } else {
          const params = new URLSearchParams({
            neighborhood: selectedLocation,
            days: String(permitDays),
          });

          endpoint =
            `/api/neighborhood-permits?${params.toString()}`;
        }

        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

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
          setPermitCount(
            layer === "neighborhoods"
              ? result.matched ?? result.permits.length
              : result.permits.length
          );
          setPermitLimited(Boolean(result.limited));
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
  }, [layer, selectedLocation, communityArea, permitDays]);

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return sortedFeatures
      .filter((feature) =>
        getName(feature, layer).toLowerCase().includes(query)
      )
      .slice(0, 12);
  }, [sortedFeatures, search, layer]);

  const permitLocations = useMemo(() => {
    const groups = new Map<string, PermitLocation>();

    for (const permit of permits) {
      const lat = permit.latitude;
      const lon = permit.longitude;

      if (
        typeof lat !== "number" ||
        typeof lon !== "number" ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
      ) {
        continue;
      }

      // Group permits at identical coordinates.
      const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;

      const existing = groups.get(key);

      if (existing) {
        existing.permits.push(permit);
      } else {
        groups.set(key, {
          key,
          latitude: lat,
          longitude: lon,
          permits: [permit],
        });
      }
    }

    return Array.from(groups.values());
  }, [permits]);

  const mappedPermitCount = permitLocations.reduce(
    (total, location) => total + location.permits.length,
    0
  );

  const unmappedPermitCount =
    permits.length - mappedPermitCount;

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
                {selectedLocation}
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

              <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Building permit activity
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {permitLoading
                    ? "Loading..."
                    : permitError
                      ? "Unavailable"
                      : permitCount.toLocaleString()}
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  {layer === "neighborhoods"
                    ? "Geocoded permits matched to this neighborhood"
                    : "Permit records returned for this community area"}
                </p>

                {!permitLoading && !permitError && (
                  <p className="mt-3 text-xs text-slate-600">
                    {mappedPermitCount} permits at{" "}
                    {permitLocations.length} mapped locations
                  </p>
                )}

                {permitLimited && (
                  <p className="mt-2 text-xs text-amber-800">
                    Results are limited to 500 records.
                  </p>
                )}
              </div>

              <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showMarkers}
                  onChange={(event) =>
                    setShowMarkers(event.target.checked)
                  }
                  className="h-4 w-4 accent-blue-700"
                />
                Show permit markers
              </label>
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
              ? "Official Chicago community areas. Permit activity uses the city's community area assignments."
              : "Approximate Chicago neighborhood boundaries. Permit activity uses coordinate-based matching and excludes records without usable coordinates."}
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
                    color: isSelected ? "#1d4ed8" : "#475569",
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

            {selected &&
              showMarkers &&
              !permitLoading &&
              !permitError &&
              permitLocations.map((location) => (
                <CircleMarker
                  key={`${selectedLocation}-${location.key}`}
                  center={[
                    location.latitude,
                    location.longitude,
                  ]}
                  radius={
                    location.permits.length > 1 ? 9 : 7
                  }
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: "#dc2626",
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup maxWidth={330} minWidth={220}>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-sm">
                          {location.permits[0].address ||
                            "Address unavailable"}
                        </strong>
                        <p className="mt-1 text-xs text-slate-600">
                          {location.permits.length}{" "}
                          {location.permits.length === 1
                            ? "permit"
                            : "permits"}{" "}
                          at this location
                        </p>
                      </div>

                      <div className="max-h-64 space-y-3 overflow-y-auto">
                        {location.permits.map((permit, index) => (
                          <div
                            key={`${permit.permitNumber}-${index}`}
                            className="border-t border-slate-200 pt-2"
                          >
                            <p className="text-xs font-semibold">
                              {permit.permitType ||
                                "Permit type unavailable"}
                            </p>

                            <p className="mt-1 text-xs">
                              <strong>Status:</strong>{" "}
                              {permit.permitStatus ||
                                permit.permitMilestone ||
                                "Unavailable"}
                            </p>

                            <p className="mt-1 text-xs">
                              <strong>Applied:</strong>{" "}
                              {formatDate(
                                permit.applicationStartDate
                              )}
                            </p>

                            <p className="mt-1 text-xs">
                              <strong>Cost:</strong>{" "}
                              {formatMoney(permit.reportedCost)}
                            </p>

                            <p className="mt-1 text-xs">
                              <strong>Permit:</strong>{" "}
                              {permit.permitNumber ||
                                "Unavailable"}
                            </p>

                            {permit.workDescription && (
                              <p className="mt-2 whitespace-normal text-xs leading-5">
                                {permit.workDescription}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>
        </div>
      </div>

      {selected && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Geographic Activity Intelligence
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Building Permits — {selectedLocation}
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                {layer === "neighborhoods"
                  ? "Recent geocoded permits inside the approximate neighborhood boundary."
                  : `Recent permit applications assigned to Community Area #${communityArea ?? "Unknown"}.`}
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
                  {permitCount.toLocaleString()} matching permit records
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Based on application start dates within the
                  selected period. Records may include pending
                  and issued permits.
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  {mappedPermitCount} permits plotted at{" "}
                  {permitLocations.length} locations.
                  {unmappedPermitCount > 0 &&
                    ` ${unmappedPermitCount} returned records have no usable coordinates.`}
                </p>

                {layer === "neighborhoods" && (
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Neighborhood results use permit coordinates
                    and approximate boundaries. Records without
                    usable coordinates are excluded.
                  </p>
                )}

                {permitLimited && (
                  <p className="mt-2 text-xs font-medium text-amber-800">
                    Only the latest 500 records are available
                    in this result.
                  </p>
                )}
              </div>

              {permits.length === 0 ? (
                <p className="mt-6 text-sm text-slate-600">
                  No matching permit records were returned
                  for this area and period.
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
                            {permit.address ||
                              "Address unavailable"}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            {permit.permitType ||
                              "Permit type unavailable"}
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
                          {formatDate(
                            permit.applicationStartDate
                          )}
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
                      Showing 25 of{" "}
                      {permits.length.toLocaleString()}{" "}
                      returned records.
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

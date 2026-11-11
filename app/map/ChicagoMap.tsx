
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GeoJSON,
  MapContainer,
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
        maxZoom: 13,
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

        setData(result);
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

  return (
    <div className="space-y-4">
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
                matches.map((feature) => (
                  <button
                    key={getName(feature, layer)}
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
                onClick={() => {
                  setSelectedName("");
                  setSearch("");
                }}
                className="mt-4 text-sm font-medium text-blue-700 hover:underline"
              >
                Clear selection
              </button>
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
              ? "Official Chicago community areas. Suitable for consistent citywide statistical comparisons."
              : "Approximate Chicago neighborhood boundaries. Names and boundaries are not officially designated."}
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
            attributionControl={false}
            style={{
              height: "620px",
              width: "100%",
              background: "#e8f0f7",
            }}
          >
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
                    fillOpacity: isSelected ? 0.65 : 0.45,
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
    </div>
  );
}

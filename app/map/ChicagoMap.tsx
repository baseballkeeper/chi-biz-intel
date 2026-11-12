
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
type Activity = "permits" | "businesses" | "inspections" | "violations" | "311" | "vacancy";

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

type Business = {
  licenseId: string;
  licenseNumber: string;
  businessName: string;
  legalName: string;
  address: string;
  zipCode: string;
  communityArea: string;
  licenseType: string;
  businessActivity: string;
  applicationType: string;
  dateIssued: string;
  licenseStartDate: string;
  licenseStatus: string;
  latitude: number | null;
  longitude: number | null;
};

type BusinessResponse = {
  count: number;
  matched?: number;
  limited: boolean;
  complete: boolean;
  businesses: Business[];
  error?: string;
};

type Inspection = {
  id: string;
  businessName: string;
  alternateName: string;
  licenseNumber: string;
  facilityType: string;
  risk: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  date: string;
  inspectionType: string;
  result: string;
  violations: string;
  latitude: number | null;
  longitude: number | null;
};

type InspectionResponse = {
  count: number;
  returned: number;
  limited: boolean;
  complete: boolean;
  inspections: Inspection[];
  error?: string;
};

type InspectionLocation = {
  key: string;
  latitude: number;
  longitude: number;
  inspections: Inspection[];
};

type Violation = {
  id: string;
  date: string;
  lastModified: string;
  code: string;
  status: string;
  description: string;
  inspectorComments: string;
  ordinance: string;
  location: string;
  inspectionNumber: string;
  inspectionStatus: string;
  inspectionCategory: string;
  department: string;
  address: string;
  propertyGroup: string;
  latitude: number | null;
  longitude: number | null;
};

type ViolationResponse = {
  count: number;
  returned: number;
  limited: boolean;
  complete: boolean;
  violations: Violation[];
  error?: string;
};

type ViolationLocation = {
  key: string;
  latitude: number;
  longitude: number;
  violations: Violation[];
};

type ServiceRequest = {
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
};

type ServiceRequestResponse = {
  count: number;
  returned: number;
  limited: boolean;
  complete: boolean;
  requests: ServiceRequest[];
  error?: string;
};

type ServiceRequestLocation = {
  key: string;
  latitude: number;
  longitude: number;
  requests: ServiceRequest[];
};

type VacancySource = "modern_311" | "historical_archive";
type VacancyFilter = "all" | VacancySource;

type VacancyRecord = {
  id: string;
  source: VacancySource;
  sourceLabel: string;
  date: string;
  address: string;
  status: string;
  type: string;
  latitude: number;
  longitude: number;
  details: Record<string, string>;
};

type VacancyResponse = {
  count: number;
  returned: number;
  limited: boolean;
  complete: boolean;
  modernCount: number;
  historicalCount: number;
  records: VacancyRecord[];
  error?: string;
};

type VacancyLocation = {
  key: string;
  latitude: number;
  longitude: number;
  records: VacancyRecord[];
};

function vacancySourceName(source: VacancySource): string {
  return source === "modern_311" ? "Modern 311 complaint" : "Historical archive report";
}

function vacancySourceColor(source: VacancySource): string {
  return source === "modern_311" ? "#d97706" : "#64748b";
}

const REQUEST_TYPES = [
  "all",
  "Graffiti Removal Request",
  "Rodent Baiting/Rat Complaint",
  "Abandoned Vehicle Complaint",
  "Pothole in Street Complaint",
  "Street Light Out Complaint",
  "Sanitation Code Violation",
  "Tree Emergency",
  "Vacant/Abandoned Building Complaint",
  "Clean Vacant Lot Request",
] as const;

function requestStatusColor(status: string): string {
  const value = status.trim().toLowerCase();
  if (value === "open") return "#d97706";
  if (value === "completed" || value === "closed") return "#16a34a";
  return "#6366f1";
}

function requestStatusBadge(status: string): string {
  const value = status.trim().toLowerCase();
  if (value === "open") return "bg-amber-50 text-amber-800";
  if (value === "completed" || value === "closed") return "bg-green-50 text-green-800";
  return "bg-slate-100 text-slate-700";
}

function violationColor(status: string): string {
  switch (status.trim().toUpperCase()) {
    case "OPEN": return "#dc2626";
    case "COMPLIED": return "#16a34a";
    case "CLOSED": return "#2563eb";
    default: return "#64748b";
  }
}

function violationBadge(status: string): string {
  switch (status.trim().toUpperCase()) {
    case "OPEN": return "bg-red-50 text-red-800";
    case "COMPLIED": return "bg-green-50 text-green-800";
    case "CLOSED": return "bg-blue-50 text-blue-800";
    default: return "bg-slate-100 text-slate-700";
  }
}

function inspectionColor(result: string): string {
  switch (result.toLowerCase()) {
    case "pass": return "#16a34a";
    case "fail": return "#dc2626";
    case "pass w/ conditions": return "#d97706";
    default: return "#64748b";
  }
}

function inspectionBadge(result: string): string {
  switch (result.toLowerCase()) {
    case "pass": return "bg-green-50 text-green-800";
    case "fail": return "bg-red-50 text-red-800";
    case "pass w/ conditions": return "bg-amber-50 text-amber-800";
    default: return "bg-slate-100 text-slate-700";
  }
}

type BusinessLocation = {
  key: string;
  latitude: number;
  longitude: number;
  businesses: Business[];
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
  const [activity, setActivity] = useState<Activity>("permits");
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
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessCount, setBusinessCount] = useState(0);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessError, setBusinessError] = useState("");
  const [businessLimited, setBusinessLimited] = useState(false);

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [inspectionCount, setInspectionCount] = useState(0);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionError, setInspectionError] = useState("");
  const [inspectionLimited, setInspectionLimited] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [violationCount, setViolationCount] = useState(0);
  const [violationLoading, setViolationLoading] = useState(false);
  const [violationError, setViolationError] = useState("");
  const [violationLimited, setViolationLimited] = useState(false);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [serviceRequestCount, setServiceRequestCount] = useState(0);
  const [serviceRequestLoading, setServiceRequestLoading] = useState(false);
  const [serviceRequestError, setServiceRequestError] = useState("");
  const [serviceRequestLimited, setServiceRequestLimited] = useState(false);
  const [requestType, setRequestType] = useState("all");
  const [vacancyFilter, setVacancyFilter] = useState<VacancyFilter>("all");
  const [vacancyRecords, setVacancyRecords] = useState<VacancyRecord[]>([]);
  const [vacancyCount, setVacancyCount] = useState(0);
  const [vacancyModernCount, setVacancyModernCount] = useState(0);
  const [vacancyHistoricalCount, setVacancyHistoricalCount] = useState(0);
  const [vacancyLoading, setVacancyLoading] = useState(false);
  const [vacancyError, setVacancyError] = useState("");
  const [vacancyLimited, setVacancyLimited] = useState(false);

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

    if (!selectedLocation || activity !== "permits") {
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
  }, [layer, selectedLocation, communityArea, permitDays, activity]);

  useEffect(() => {
    const controller = new AbortController();
    if (!selectedLocation || activity !== "businesses") {
      setBusinesses([]);
      setBusinessCount(0);
      setBusinessLimited(false);
      setBusinessError("");
      setBusinessLoading(false);
      return () => controller.abort();
    }

    async function loadBusinesses() {
      setBusinessLoading(true);
      setBusinessError("");
      setBusinesses([]);
      setBusinessCount(0);
      setBusinessLimited(false);
      try {
        const params = new URLSearchParams({ days: String(permitDays) });
        if (layer === "communities") {
          if (!communityArea) throw new Error("Community area number unavailable");
          params.set("area", communityArea);
        } else {
          params.set("neighborhood", selectedLocation);
        }
        const response = await fetch(`/api/map-businesses?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as BusinessResponse;
        if (!response.ok) {
          throw new Error(result.error || `Business license request failed (${response.status})`);
        }
        if (!Array.isArray(result.businesses)) {
          throw new Error("Invalid business license response");
        }
        if (!controller.signal.aborted) {
          setBusinesses(result.businesses);
          setBusinessCount(result.count);
          setBusinessLimited(Boolean(result.limited) || !result.complete);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setBusinessError(err instanceof Error ? err.message : "Could not load business licenses");
        }
      } finally {
        if (!controller.signal.aborted) setBusinessLoading(false);
      }
    }
    loadBusinesses();
    return () => controller.abort();
  }, [layer, selectedLocation, communityArea, permitDays, activity]);

  useEffect(() => {
    const controller = new AbortController();
    if (!selectedLocation || activity !== "inspections") {
      setInspections([]);
      setInspectionCount(0);
      setInspectionLimited(false);
      setInspectionError("");
      setInspectionLoading(false);
      return () => controller.abort();
    }

    async function loadInspections() {
      setInspectionLoading(true);
      setInspectionError("");
      setInspections([]);
      setInspectionCount(0);
      setInspectionLimited(false);
      try {
        const params = new URLSearchParams({ days: String(permitDays) });
        if (layer === "communities") {
          if (!communityArea) throw new Error("Community area number unavailable");
          params.set("area", communityArea);
        } else {
          params.set("neighborhood", selectedLocation);
        }
        const response = await fetch(`/api/map-inspections?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as InspectionResponse;
        if (!response.ok) {
          throw new Error(result.error || `Food inspection request failed (${response.status})`);
        }
        if (!Array.isArray(result.inspections)) {
          throw new Error("Invalid food inspection response");
        }
        if (!controller.signal.aborted) {
          setInspections(result.inspections);
          setInspectionCount(result.count);
          setInspectionLimited(Boolean(result.limited) || !result.complete);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setInspectionError(err instanceof Error ? err.message : "Could not load food inspections");
        }
      } finally {
        if (!controller.signal.aborted) setInspectionLoading(false);
      }
    }
    loadInspections();
    return () => controller.abort();
  }, [layer, selectedLocation, communityArea, permitDays, activity]);

  useEffect(() => {
    const controller = new AbortController();
    if (!selectedLocation || activity !== "violations") {
      setViolations([]);
      setViolationCount(0);
      setViolationLimited(false);
      setViolationError("");
      setViolationLoading(false);
      return () => controller.abort();
    }

    async function loadViolations() {
      setViolationLoading(true);
      setViolationError("");
      setViolations([]);
      setViolationCount(0);
      setViolationLimited(false);
      try {
        const params = new URLSearchParams({ days: String(permitDays) });
        if (layer === "communities") {
          if (!communityArea) throw new Error("Community area number unavailable");
          params.set("area", communityArea);
        } else {
          params.set("neighborhood", selectedLocation);
        }
        const response = await fetch(`/api/map-violations?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as ViolationResponse;
        if (!response.ok) {
          throw new Error(result.error || `Building violation request failed (${response.status})`);
        }
        if (!Array.isArray(result.violations)) {
          throw new Error("Invalid building violation response");
        }
        if (!controller.signal.aborted) {
          setViolations(result.violations);
          setViolationCount(result.count);
          setViolationLimited(Boolean(result.limited) || !result.complete);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setViolationError(err instanceof Error ? err.message : "Could not load building violations");
        }
      } finally {
        if (!controller.signal.aborted) setViolationLoading(false);
      }
    }
    loadViolations();
    return () => controller.abort();
  }, [layer, selectedLocation, communityArea, permitDays, activity]);

  useEffect(() => {
    const controller = new AbortController();

    if (!selectedLocation || activity !== "311") {
      setServiceRequests([]);
      setServiceRequestCount(0);
      setServiceRequestLimited(false);
      setServiceRequestError("");
      setServiceRequestLoading(false);
      return () => controller.abort();
    }

    async function loadServiceRequests() {
      setServiceRequestLoading(true);
      setServiceRequestError("");
      setServiceRequests([]);
      setServiceRequestCount(0);
      setServiceRequestLimited(false);

      try {
        const params = new URLSearchParams({
          days: String(permitDays),
          type: requestType,
        });
        if (layer === "communities") {
          if (!communityArea) throw new Error("Community area number unavailable");
          params.set("area", communityArea);
        } else {
          params.set("neighborhood", selectedLocation);
        }

        const response = await fetch(`/api/map-311?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as ServiceRequestResponse;
        if (!response.ok) {
          throw new Error(result.error || `311 request failed (${response.status})`);
        }
        if (!Array.isArray(result.requests) || !result.complete) {
          throw new Error("Incomplete or invalid 311 response");
        }
        if (!controller.signal.aborted) {
          setServiceRequests(result.requests);
          setServiceRequestCount(result.count);
          setServiceRequestLimited(Boolean(result.limited));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setServiceRequestError(err instanceof Error ? err.message : "Could not load 311 requests");
        }
      } finally {
        if (!controller.signal.aborted) setServiceRequestLoading(false);
      }
    }

    loadServiceRequests();
    return () => controller.abort();
  }, [layer, selectedLocation, communityArea, permitDays, activity, requestType]);

  useEffect(() => {
    const controller = new AbortController();

    if (!selectedLocation || activity !== "vacancy") {
      setVacancyRecords([]);
      setVacancyCount(0);
      setVacancyModernCount(0);
      setVacancyHistoricalCount(0);
      setVacancyLoading(false);
      setVacancyError("");
      setVacancyLimited(false);
      return () => controller.abort();
    }

    async function loadVacancy() {
      setVacancyLoading(true);
      setVacancyError("");
      setVacancyRecords([]);
      setVacancyCount(0);
      setVacancyModernCount(0);
      setVacancyHistoricalCount(0);
      setVacancyLimited(false);
      try {
        const params = new URLSearchParams({ days: String(permitDays) });
        if (layer === "communities") {
          if (!communityArea) throw new Error("Community area number unavailable");
          params.set("area", communityArea);
        } else {
          params.set("neighborhood", selectedLocation);
        }
        const response = await fetch(`/api/map-vacancy?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as VacancyResponse;
        if (!response.ok) {
          throw new Error(result.error || `Vacancy request failed (${response.status})`);
        }
        if (!Array.isArray(result.records) || !result.complete) {
          throw new Error("Incomplete or invalid vacancy response");
        }
        if (!controller.signal.aborted) {
          setVacancyRecords(result.records);
          setVacancyCount(result.count);
          setVacancyModernCount(result.modernCount);
          setVacancyHistoricalCount(result.historicalCount);
          setVacancyLimited(Boolean(result.limited));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setVacancyError(err instanceof Error ? err.message : "Could not load vacancy reports");
        }
      } finally {
        if (!controller.signal.aborted) setVacancyLoading(false);
      }
    }

    loadVacancy();
    return () => controller.abort();
  }, [layer, selectedLocation, communityArea, permitDays, activity]);

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

  const businessLocations = useMemo(() => {
    const groups = new Map<string, BusinessLocation>();
    for (const business of businesses) {
      const lat = business.latitude;
      const lon = business.longitude;
      if (typeof lat !== "number" || typeof lon !== "number" ||
          !Number.isFinite(lat) || !Number.isFinite(lon) ||
          lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
      const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      const existing = groups.get(key);
      if (existing) existing.businesses.push(business);
      else groups.set(key, { key, latitude: lat, longitude: lon, businesses: [business] });
    }
    return Array.from(groups.values());
  }, [businesses]);

  const mappedBusinessCount = businessLocations.reduce(
    (total, location) => total + location.businesses.length, 0
  );
  const unmappedBusinessCount = businesses.length - mappedBusinessCount;

  const inspectionLocations = useMemo(() => {
    const groups = new Map<string, InspectionLocation>();
    for (const inspection of inspections) {
      const lat = inspection.latitude;
      const lon = inspection.longitude;
      if (typeof lat !== "number" || typeof lon !== "number" ||
          !Number.isFinite(lat) || !Number.isFinite(lon) ||
          lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
      const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      const existing = groups.get(key);
      if (existing) existing.inspections.push(inspection);
      else groups.set(key, { key, latitude: lat, longitude: lon, inspections: [inspection] });
    }
    return Array.from(groups.values());
  }, [inspections]);

  const mappedInspectionCount = inspectionLocations.reduce(
    (total, location) => total + location.inspections.length, 0
  );
  const inspectionResults = useMemo(() => ({
    passed: inspections.filter((item) => item.result === "Pass").length,
    failed: inspections.filter((item) => item.result === "Fail").length,
    conditional: inspections.filter((item) => item.result === "Pass w/ Conditions").length,
  }), [inspections]);

  const violationLocations = useMemo(() => {
    const groups = new Map<string, ViolationLocation>();
    for (const violation of violations) {
      const lat = violation.latitude;
      const lon = violation.longitude;
      if (typeof lat !== "number" || typeof lon !== "number" ||
          !Number.isFinite(lat) || !Number.isFinite(lon) ||
          lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
      const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      const existing = groups.get(key);
      if (existing) existing.violations.push(violation);
      else groups.set(key, { key, latitude: lat, longitude: lon, violations: [violation] });
    }
    return Array.from(groups.values());
  }, [violations]);

  const mappedViolationCount = violationLocations.reduce(
    (total, location) => total + location.violations.length, 0
  );
  const violationStatuses = useMemo(() => ({
    open: violations.filter((item) => item.status.toUpperCase() === "OPEN").length,
    complied: violations.filter((item) => item.status.toUpperCase() === "COMPLIED").length,
    closed: violations.filter((item) => item.status.toUpperCase() === "CLOSED").length,
  }), [violations]);

  const serviceRequestLocations = useMemo(() => {
    const groups = new Map<string, ServiceRequestLocation>();
    for (const item of serviceRequests) {
      const lat = item.latitude;
      const lon = item.longitude;
      if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
          lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
      const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      const existing = groups.get(key);
      if (existing) existing.requests.push(item);
      else groups.set(key, { key, latitude: lat, longitude: lon, requests: [item] });
    }
    return Array.from(groups.values());
  }, [serviceRequests]);

  const mappedServiceRequestCount = serviceRequestLocations.reduce(
    (total, location) => total + location.requests.length, 0
  );

  const filteredVacancyRecords = useMemo(
    () => vacancyFilter === "all"
      ? vacancyRecords
      : vacancyRecords.filter((record) => record.source === vacancyFilter),
    [vacancyRecords, vacancyFilter]
  );

  const vacancyLocations = useMemo(() => {
    const groups = new Map<string, VacancyLocation>();
    for (const record of filteredVacancyRecords) {
      const lat = record.latitude;
      const lon = record.longitude;
      if (typeof lat !== "number" || typeof lon !== "number" ||
          !Number.isFinite(lat) || !Number.isFinite(lon) ||
          lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
      // Keep the two source categories separate even at identical coordinates.
      const key = `${record.source}-${lat.toFixed(6)},${lon.toFixed(6)}`;
      const existing = groups.get(key);
      if (existing) existing.records.push(record);
      else groups.set(key, { key, latitude: lat, longitude: lon, records: [record] });
    }
    return Array.from(groups.values());
  }, [filteredVacancyRecords]);

  const mappedVacancyCount = vacancyLocations.reduce(
    (total, location) => total + location.records.length, 0
  );
  const visibleVacancyCount = vacancyFilter === "modern_311"
    ? vacancyModernCount
    : vacancyFilter === "historical_archive"
      ? vacancyHistoricalCount
      : vacancyCount;

  const activeLoading = activity === "permits" ? permitLoading : activity === "businesses" ? businessLoading : activity === "inspections" ? inspectionLoading : activity === "vacancy" ? vacancyLoading : activity === "311" ? serviceRequestLoading : violationLoading;
  const activeError = activity === "permits" ? permitError : activity === "businesses" ? businessError : activity === "inspections" ? inspectionError : activity === "vacancy" ? vacancyError : activity === "311" ? serviceRequestError : violationError;
  const activeCount = activity === "permits" ? permitCount : activity === "businesses" ? businessCount : activity === "inspections" ? inspectionCount : activity === "vacancy" ? visibleVacancyCount : activity === "311" ? serviceRequestCount : violationCount;
  const activeLimited = activity === "permits" ? permitLimited : activity === "businesses" ? businessLimited : activity === "inspections" ? inspectionLimited : activity === "vacancy" ? vacancyLimited : activity === "311" ? serviceRequestLimited : violationLimited;
  const activeMappedCount = activity === "permits" ? mappedPermitCount : activity === "businesses" ? mappedBusinessCount : activity === "inspections" ? mappedInspectionCount : activity === "vacancy" ? mappedVacancyCount : activity === "311" ? mappedServiceRequestCount : mappedViolationCount;
  const activeLocationsCount = activity === "permits" ? permitLocations.length : activity === "businesses" ? businessLocations.length : activity === "inspections" ? inspectionLocations.length : activity === "vacancy" ? vacancyLocations.length : activity === "311" ? serviceRequestLocations.length : violationLocations.length;

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
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <label htmlFor="activity-layer" className="text-sm font-semibold text-slate-800">
          Activity layer
        </label>
        <select
          id="activity-layer"
          value={activity}
          onChange={(event) => setActivity(event.target.value as Activity)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        >
          <option value="permits">Building permits</option>
          <option value="businesses">Newly issued business licenses</option>
          <option value="inspections">Food inspections</option>
          <option value="violations">Building violations</option>
          <option value="311">311 service requests</option>
          <option value="vacancy">Vacant building reports</option>
        </select>
        <span className="text-xs text-slate-500">One dataset at a time</span>
      </div>


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
                  {activity === "permits"
                    ? "Building permit activity"
                    : activity === "businesses"
                      ? "Newly issued business licenses"
                      : activity === "inspections"
                        ? "Food inspection activity"
                        : activity === "311"
                          ? "311 service requests"
                         : activity === "vacancy"
                            ? "Vacant building reports"
                            : "Building violation activity"}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {activeLoading
                    ? "Loading..."
                    : activeError
                      ? "Unavailable"
                      : activeCount.toLocaleString()}
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  {layer === "neighborhoods"
                    ? `Geocoded ${
                        activity === "permits"
                          ? "permits"
                          : activity === "businesses"
                            ? "licenses"
                            : activity === "inspections"
                              ? "inspections"
                              : activity === "311"
                                ? "311 requests"
                               : activity === "vacancy"
                                  ? "vacancy reports"
                                  : "violations"
                      } matched to this neighborhood`
                    : `${
                        activity === "permits"
                          ? "Permit"
                          : activity === "businesses"
                            ? "License"
                            : activity === "inspections"
                              ? "Inspection"
                              : activity === "311"
                                ? "311 request"
                               : activity === "vacancy"
                                  ? "Vacancy report"
                                  : "Violation"
                      } records returned for this community area`}
                </p>

                {!activeLoading && !activeError && (
                  <p className="mt-3 text-xs text-slate-600">
                    {activeMappedCount} records at{" "}
                    {activeLocationsCount} mapped locations
                  </p>
                )}

                {activeLimited && (
                  <p className="mt-2 text-xs text-amber-800">
                     {activity === "vacancy"
                       ? `Showing ${vacancyRecords.length.toLocaleString()} of ${vacancyCount.toLocaleString()} matching reports (combined limit).`
                       : activity === "311"
                       ? `Showing the newest ${serviceRequests.length.toLocaleString()} of ${serviceRequestCount.toLocaleString()} matching requests.`
                       : "Results may be incomplete due to query limits."}
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
                Show{" "}
                {activity === "permits"
                  ? "permit"
                  : activity === "businesses"
                    ? "business license"
                    : activity === "inspections"
                      ? "food inspection"
                      : activity === "311"
                        ? "311 request"
                        : activity === "vacancy"
                          ? "vacancy report"
                          : "building violation"}{" "}
                markers
              </label>

                              {activity === "vacancy" && (
                 <p className="mt-5 text-xs leading-5 text-slate-500">
                   Sources: Chicago 311 Service Requests (v6vf-nfxy) and historical Vacant and Abandoned Buildings
                   (7nii-7srd). These are reports, not verified current vacancy conditions. The archive ends before
                   December 18, 2018; the selected time range applies only to modern complaints. Only records with
                   usable coordinates within the selected boundary appear. Combined results are capped at 2,000.
                 </p>
               )}

                              {activity === "311" && (
<p className="mt-4 text-xs leading-5 text-slate-600">
                   Reports submitted to Chicago 311 are not independently verified
                   violations or proof of current conditions. Results require usable coordinates.
                 </p>
               )}

               {activity === "vacancy" && (
                 <div className="mt-4 space-y-2 text-xs leading-5 text-slate-600">
                   <p><span className="font-semibold text-amber-800">Modern 311 complaints:</span> {vacancyModernCount.toLocaleString()} (last {permitDays} days)</p>
                   <p><span className="font-semibold text-slate-700">Historical archive:</span> {vacancyHistoricalCount.toLocaleString()} (before Dec 18, 2018)</p>
                   <p>Reports and complaints are not proof that a building is currently vacant.</p>
                 </div>
               )}

               {activity === "inspections" && !inspectionLoading &&
                !inspectionError && (
                  <div className="mt-4 space-y-1 text-xs text-slate-600">
                    <p>Passed: {inspectionResults.passed}</p>
                    <p>Failed: {inspectionResults.failed}</p>
                    <p>Passed with conditions: {inspectionResults.conditional}</p>
                  </div>
                )}

              {activity === "violations" && !violationLoading &&
                !violationError && (
                  <div className="mt-4 space-y-1 text-xs text-slate-600">
                    <p>Open: {violationStatuses.open}</p>
                    <p>Complied: {violationStatuses.complied}</p>
                    <p>Closed: {violationStatuses.closed}</p>
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
              ? "Official Chicago community areas. Building permits use the city's community area assignments; other activity layers use coordinates."
              : "Approximate Chicago neighborhood boundaries. Geographic matching uses coordinates and excludes records without usable coordinates."}
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
              activity === "permits" &&
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

            {selected && showMarkers && activity === "businesses" &&
              !businessLoading && !businessError &&
              businessLocations.map((location) => (
                <CircleMarker
                  key={`business-${selectedLocation}-${location.key}`}
                  center={[location.latitude, location.longitude]}
                  radius={location.businesses.length > 1 ? 9 : 7}
                  pathOptions={{
                    color: "#ffffff", weight: 2, fillColor: "#0d9488", fillOpacity: 0.9,
                  }}
                >
                  <Popup maxWidth={330} minWidth={220}>
                    <div className="space-y-3">
                      <strong className="text-sm">{location.businesses[0].address || "Address unavailable"}</strong>
                      <p className="text-xs text-slate-600">
                        {location.businesses.length} {location.businesses.length === 1 ? "license" : "licenses"} at this location
                      </p>
                      <div className="max-h-64 space-y-3 overflow-y-auto">
                        {location.businesses.map((business, index) => (
                          <div key={`${business.licenseId}-${index}`} className="border-t border-slate-200 pt-2">
                            <p className="text-xs font-semibold">{business.businessName}</p>
                            <p className="mt-1 text-xs"><strong>License:</strong> {business.licenseType || "Not available"}</p>
                            <p className="mt-1 text-xs"><strong>Issued:</strong> {formatDate(business.dateIssued)}</p>
                            <p className="mt-1 text-xs"><strong>License number:</strong> {business.licenseNumber || "Not available"}</p>
                            {business.businessActivity && <p className="mt-2 text-xs leading-5">{business.businessActivity}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

            {selected && showMarkers && activity === "inspections" &&
              !inspectionLoading && !inspectionError &&
              inspectionLocations.map((location) => (
                <CircleMarker
                  key={`inspection-${selectedLocation}-${location.key}`}
                  center={[location.latitude, location.longitude]}
                  radius={location.inspections.length > 1 ? 9 : 7}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: inspectionColor(location.inspections[0].result),
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup maxWidth={350} minWidth={230}>
                    <div className="space-y-3">
                      <strong className="text-sm">
                        {location.inspections[0].address || "Address unavailable"}
                      </strong>
                      <p className="text-xs text-slate-600">
                        {location.inspections.length} {location.inspections.length === 1 ? "inspection" : "inspections"} at this location
                      </p>
                      <div className="max-h-72 space-y-3 overflow-y-auto">
                        {location.inspections.map((inspection, index) => (
                          <div key={`${inspection.id}-${index}`} className="border-t border-slate-200 pt-2">
                            <p className="text-xs font-semibold">{inspection.businessName || "Business name unavailable"}</p>
                            <p className="mt-1 text-xs"><strong>Result:</strong> {inspection.result || "Unavailable"}</p>
                            <p className="mt-1 text-xs"><strong>Inspected:</strong> {formatDate(inspection.date)}</p>
                            <p className="mt-1 text-xs"><strong>Type:</strong> {inspection.inspectionType || "Unavailable"}</p>
                            {inspection.violations && (
                              <details className="mt-2 text-xs">
                                <summary className="cursor-pointer font-semibold text-blue-700">Violation details</summary>
                                <p className="mt-2 whitespace-pre-wrap leading-5">{inspection.violations}</p>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

                         {selected && showMarkers && activity === "311" &&
               !serviceRequestLoading && !serviceRequestError &&
               serviceRequestLocations.map((location) => (
                 <CircleMarker
                   key={`311-${selectedLocation}-${location.key}`}
                   center={[location.latitude, location.longitude]}
                   radius={location.requests.length > 1 ? 9 : 7}
                   pathOptions={{
                     color: "#ffffff",
                     weight: 2,
                     fillColor: requestStatusColor(location.requests[0].status),
                     fillOpacity: 0.9,
                   }}
                 >
                   <Popup maxWidth={350} minWidth={230}>
                     <div className="space-y-3">
                       <strong className="text-sm">
                         {location.requests[0].address || "Address unavailable"}
                       </strong>
                       <p className="text-xs text-slate-600">
                         {location.requests.length} 311 {location.requests.length === 1 ? "request" : "requests"} at this location
                       </p>
                       <div className="max-h-72 space-y-3 overflow-y-auto">
                         {location.requests.map((item, index) => (
                           <div key={`${item.requestNumber}-${index}`} className="border-t border-slate-200 pt-2">
                             <p className="text-xs font-semibold">{item.type || "311 service request"}</p>
                             <p className="mt-1 text-xs"><strong>Status:</strong> {item.status || "Unavailable"}</p>
                             <p className="mt-1 text-xs"><strong>Reported:</strong> {formatDate(item.createdDate)}</p>
                             <p className="mt-1 text-xs"><strong>Request:</strong> {item.requestNumber || "Unavailable"}</p>
                             {item.duplicate && <p className="mt-1 text-xs text-amber-800">Marked duplicate by the city</p>}
                           </div>
                         ))}
                       </div>
                     </div>
                   </Popup>
                 </CircleMarker>
               ))}

             {selected && showMarkers && activity === "vacancy" &&
               !vacancyLoading && !vacancyError &&
               vacancyLocations.map((location) => (
                 <CircleMarker
                   key={`vacancy-${selectedLocation}-${location.key}`}
                   center={[location.latitude, location.longitude]}
                   radius={location.records.length > 1 ? 9 : 7}
                   pathOptions={{
                     color: "#ffffff", weight: 2,
                     fillColor: vacancySourceColor(location.records[0].source),
                     fillOpacity: 0.9,
                   }}
                 >
                   <Popup maxWidth={350} minWidth={230}>
                     <div className="space-y-3">
                       <strong className="text-sm">{location.records[0].address || "Address unavailable"}</strong>
                       <p className="text-xs text-slate-600">
                         {location.records.length} {vacancySourceName(location.records[0].source).toLowerCase()}
                         {location.records.length === 1 ? "" : "s"} at this location
                       </p>
                       <div className="max-h-72 space-y-3 overflow-y-auto">
                         {location.records.map((record, index) => (
                           <div key={`${record.source}-${record.id}-${index}`} className="border-t border-slate-200 pt-2">
                             <p className="text-xs font-semibold" style={{ color: vacancySourceColor(record.source) }}>
                               {vacancySourceName(record.source)}
                             </p>
                             <p className="mt-1 text-xs"><strong>Reported:</strong> {formatDate(record.date)}</p>
                             <p className="mt-1 text-xs"><strong>Request:</strong> {record.id || "Unavailable"}</p>
                             {record.source === "modern_311" && <p className="mt-1 text-xs"><strong>311 status:</strong> {record.status || "Unavailable"}</p>}
                             {record.source === "historical_archive" && <p className="mt-1 text-xs">Historical report — current vacancy unknown</p>}
                             {Object.entries(record.details || {}).map(([key, value]) => (
                               <p key={key} className="mt-1 text-xs"><strong>{key}:</strong> {value}</p>
                             ))}
                           </div>
                         ))}
                       </div>
                     </div>
                   </Popup>
                 </CircleMarker>
               ))}

             {selected && showMarkers && activity === "violations" &&
              !violationLoading && !violationError &&
              violationLocations.map((location) => (
                <CircleMarker
                  key={`violation-${selectedLocation}-${location.key}`}
                  center={[location.latitude, location.longitude]}
                  radius={location.violations.length > 1 ? 9 : 7}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: violationColor(location.violations[0].status),
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup maxWidth={350} minWidth={230}>
                    <div className="space-y-3">
                      <strong className="text-sm">
                        {location.violations[0].address || "Address unavailable"}
                      </strong>
                      <p className="text-xs text-slate-600">
                        {location.violations.length} {location.violations.length === 1 ? "violation" : "violations"} at this location
                      </p>
                      <div className="max-h-72 space-y-3 overflow-y-auto">
                        {location.violations.map((violation, index) => (
                          <div key={`${violation.id}-${index}`} className="border-t border-slate-200 pt-2">
                            <p className="text-xs font-semibold">{violation.description || violation.code || "Building violation"}</p>
                            <p className="mt-1 text-xs"><strong>Status:</strong> {violation.status || "Unavailable"}</p>
                            <p className="mt-1 text-xs"><strong>Reported:</strong> {formatDate(violation.date)}</p>
                            <p className="mt-1 text-xs"><strong>Code:</strong> {violation.code || "Unavailable"}</p>
                            {violation.inspectorComments && (
                              <details className="mt-2 text-xs">
                                <summary className="cursor-pointer font-semibold text-blue-700">Inspector comments</summary>
                                <p className="mt-2 whitespace-pre-wrap leading-5">{violation.inspectorComments}</p>
                              </details>
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
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {activity === "permits"
                  ? "Recent Building Permits"
                  : activity === "businesses"
                    ? "Recently Issued Business Licenses"
                    : activity === "inspections"
                      ? "Recent Food Inspections"
                                             : activity === "311"
                         ? "Recent 311 Service Requests"
                         : activity === "vacancy"
                           ? "Vacant Building Reports"
                           : "Recent Building Violations"}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {selectedLocation} —{" "}
                {layer === "communities"
                  ? "Community Area"
                  : "Neighborhood"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="activity-days"
                className="text-sm font-medium text-slate-700"
              >
                Time range
              </label>

              <select
                id="activity-days"
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

          {activity === "311" && (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="311-type" className="text-sm font-medium text-slate-700">Request type</label>
              <select id="311-type" value={requestType}
                onChange={(event) => setRequestType(event.target.value)}
                className="max-w-[260px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                {REQUEST_TYPES.map((type) => (
                  <option key={type} value={type}>{type === "all" ? "All request types" : type}</option>
                ))}
              </select>
            </div>
          )}

           {activity === "vacancy" && (
             <div className="mt-4 space-y-3">
               <div className="flex flex-wrap items-center gap-2">
                 <label htmlFor="vacancy-source" className="text-sm font-medium text-slate-700">Report source</label>
                 <select id="vacancy-source" value={vacancyFilter}
                   onChange={(event) => setVacancyFilter(event.target.value as VacancyFilter)}
                   className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                   <option value="all">All reports</option>
                   <option value="modern_311">Modern 311 complaints</option>
                   <option value="historical_archive">Historical archive</option>
                 </select>
               </div>
               <p className="text-xs leading-5 text-slate-600">
                 Time range applies only to modern 311 complaints. Historical archive records are from before December 18, 2018.
                 Orange markers indicate modern complaints; gray markers indicate historical reports.
               </p>
             </div>
           )}

          {activeLoading && (
            <p className="mt-6 text-sm text-slate-600">
              Loading records...
            </p>
          )}

          {activeError && (
            <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {activeError}
            </div>
          )}

          {!activeLoading && !activeError && (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {activeCount.toLocaleString()} records
                </span>

                <span>
                  {activeLocationsCount.toLocaleString()} mapped
                  locations
                </span>

                {activeLimited && (
                  <span className="font-medium text-amber-700">
                     {activity === "vacancy"
                       ? `Showing ${filteredVacancyRecords.length.toLocaleString()} of ${visibleVacancyCount.toLocaleString()} matching source reports (combined limit)`
                       : activity === "311"
                       ? `Showing ${serviceRequests.length.toLocaleString()} of ${serviceRequestCount.toLocaleString()}`
                       : "Results may be incomplete"}
                  </span>
                )}
              </div>

              {activity === "permits" &&
                unmappedPermitCount > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    {unmappedPermitCount.toLocaleString()} permit
                    records have no usable map coordinates.
                    They are still included in the list below.
                  </p>
                )}

              {activity === "businesses" &&
                unmappedBusinessCount > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    {unmappedBusinessCount.toLocaleString()} license
                    records have no usable map coordinates.
                    They are still included in the list below.
                  </p>
                )}

              {activity === "inspections" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800">
                    Pass: {inspectionResults.passed}
                  </span>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-800">
                    Fail: {inspectionResults.failed}
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                    Pass with conditions: {inspectionResults.conditional}
                  </span>
                </div>
              )}

              {activity === "violations" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-800">
                    Open: {violationStatuses.open}
                  </span>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800">
                    Complied: {violationStatuses.complied}
                  </span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                    Closed: {violationStatuses.closed}
                  </span>
                </div>
              )}

               {activity === "vacancy" && (
                 <div className="mt-4 flex flex-wrap gap-2 text-xs">
                   <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800">Modern 311: {vacancyModernCount.toLocaleString()}</span>
                   <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">Historical archive: {vacancyHistoricalCount.toLocaleString()}</span>
                 </div>
               )}

              {activeCount === 0 ? (
                <div className="mt-6 rounded-lg bg-slate-50 p-6 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No records found for this location and time range.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                     {activity === "vacancy" && vacancyFilter === "historical_archive"
                       ? "No historical reports were found within this boundary."
                       : "Try selecting a longer time range or another report source."}
                  </p>
                </div>
              ) : (
                <div className="mt-5 max-h-[680px] space-y-3 overflow-y-auto pr-1">
                   {activity === "vacancy" &&
                     filteredVacancyRecords.map((record, index) => (
                       <article key={`${record.source}-${record.id}-${index}`} className="rounded-lg border border-slate-200 p-4">
                         <div className="flex flex-wrap items-start justify-between gap-3">
                           <div>
                             <h3 className="font-semibold text-slate-900">{record.address || "Address unavailable"}</h3>
                             <p className="mt-1 text-sm text-slate-600">{record.type || "Vacant-building report"}</p>
                           </div>
                           <span className={`rounded-full px-3 py-1 text-xs font-medium ${record.source === "modern_311" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                             {vacancySourceName(record.source)}
                           </span>
                         </div>
                         <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                           <p><strong>Reported:</strong> {formatDate(record.date)}</p>
                           <p><strong>Request number:</strong> {record.id || "Unavailable"}</p>
                           {record.source === "modern_311" && <p><strong>311 status:</strong> {record.status || "Unavailable"}</p>}
                           {record.source === "historical_archive" && <p><strong>Current vacancy:</strong> Unknown (archival report)</p>}
                         </div>
                         {Object.keys(record.details || {}).length > 0 && (
                           <details className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                             <summary className="cursor-pointer font-semibold text-blue-700">Report details</summary>
                             <div className="mt-2 space-y-1">
                               {Object.entries(record.details).map(([key, value]) => (
                                 <p key={key}><strong>{key}:</strong> {value}</p>
                               ))}
                             </div>
                           </details>
                         )}
                       </article>
                     ))}

                   {activity === "permits" &&
                     permits.map((permit, index) => (
                      <article
                        key={`${permit.permitNumber}-${index}`}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {permit.address || "Address unavailable"}
                            </h3>
                            <p className="mt-1 text-sm text-slate-700">
                              {permit.permitType || "Building permit"}
                            </p>
                          </div>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                            {permit.permitStatus ||
                              permit.permitMilestone ||
                              "Status unavailable"}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <p>
                            <strong>Applied:</strong>{" "}
                            {formatDate(permit.applicationStartDate)}
                          </p>
                          <p>
                            <strong>Issued:</strong>{" "}
                            {formatDate(permit.issueDate)}
                          </p>
                          <p>
                            <strong>Reported cost:</strong>{" "}
                            {formatMoney(permit.reportedCost)}
                          </p>
                          <p>
                            <strong>Permit number:</strong>{" "}
                            {permit.permitNumber || "Unavailable"}
                          </p>
                        </div>

                        {permit.workDescription && (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {permit.workDescription}
                          </p>
                        )}
                      </article>
                    ))}

                  {activity === "businesses" &&
                    businesses.map((business, index) => (
                      <article
                        key={`${business.licenseId}-${index}`}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {business.businessName ||
                                "Business name unavailable"}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                              {business.address || "Address unavailable"}
                            </p>
                          </div>
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
                            {business.licenseStatus || "Issued"}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <p>
                            <strong>License type:</strong>{" "}
                            {business.licenseType || "Unavailable"}
                          </p>
                          <p>
                            <strong>Date issued:</strong>{" "}
                            {formatDate(business.dateIssued)}
                          </p>
                          <p>
                            <strong>License number:</strong>{" "}
                            {business.licenseNumber || "Unavailable"}
                          </p>
                          <p>
                            <strong>Application:</strong>{" "}
                            {business.applicationType || "Unavailable"}
                          </p>
                        </div>

                        {business.businessActivity && (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {business.businessActivity}
                          </p>
                        )}
                      </article>
                    ))}

                  {activity === "inspections" &&
                    inspections.map((inspection, index) => (
                      <article
                        key={`${inspection.id}-${index}`}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {inspection.businessName ||
                                "Business name unavailable"}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                              {inspection.address || "Address unavailable"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${inspectionBadge(
                              inspection.result
                            )}`}
                          >
                            {inspection.result || "Unknown"}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <p>
                            <strong>Inspection date:</strong>{" "}
                            {formatDate(inspection.date)}
                          </p>
                          <p>
                            <strong>Facility type:</strong>{" "}
                            {inspection.facilityType || "Unavailable"}
                          </p>
                          <p>
                            <strong>Inspection type:</strong>{" "}
                            {inspection.inspectionType || "Unavailable"}
                          </p>
                          <p>
                            <strong>Risk:</strong>{" "}
                            {inspection.risk || "Unavailable"}
                          </p>
                          <p>
                            <strong>Inspection ID:</strong>{" "}
                            {inspection.id || "Unavailable"}
                          </p>
                        </div>

                        {inspection.violations && (
                          <details className="mt-4 rounded-lg bg-slate-50 p-3">
                            <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                              View inspection violations
                            </summary>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                              {inspection.violations}
                            </p>
                          </details>
                        )}
                      </article>
                    ))}

                                     {activity === "311" &&
                     serviceRequests.map((item, index) => (
                       <article
                         key={`${item.requestNumber}-${index}`}
                         className="rounded-lg border border-slate-200 p-4"
                       >
                         <div className="flex flex-wrap items-start justify-between gap-3">
                           <div>
                             <h3 className="font-semibold text-slate-900">
                               {item.type || "311 service request"}
                             </h3>
                             <p className="mt-1 text-sm text-slate-600">
                               {item.address || "Address unavailable"}
                             </p>
                           </div>
                           <span className={`rounded-full px-3 py-1 text-xs font-medium ${requestStatusBadge(item.status)}`}>
                             {item.status || "Unknown"}
                           </span>
                         </div>
                         <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                           <p><strong>Reported:</strong> {formatDate(item.createdDate)}</p>
                           <p><strong>Closed:</strong> {formatDate(item.closedDate)}</p>
                           <p><strong>Request number:</strong> {item.requestNumber || "Unavailable"}</p>
                           <p><strong>City duplicate flag:</strong> {item.duplicate ? "Yes" : "No"}</p>
                         </div>
                       </article>
                     ))}

                   {activity === "violations" &&
                     violations.map((violation, index) => (
                      <article
                        key={`${violation.id}-${index}`}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {violation.address || "Address unavailable"}
                            </h3>
                            <p className="mt-1 text-sm text-slate-700">
                              {violation.description ||
                                "Building violation"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${violationBadge(
                              violation.status
                            )}`}
                          >
                            {violation.status || "Unknown"}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <p>
                            <strong>Violation date:</strong>{" "}
                            {formatDate(violation.date)}
                          </p>
                          <p>
                            <strong>Violation code:</strong>{" "}
                            {violation.code || "Unavailable"}
                          </p>
                          <p>
                            <strong>Department:</strong>{" "}
                            {violation.department || "Unavailable"}
                          </p>
                          <p>
                            <strong>Inspection number:</strong>{" "}
                            {violation.inspectionNumber ||
                              "Unavailable"}
                          </p>
                          <p>
                            <strong>Inspection status:</strong>{" "}
                            {violation.inspectionStatus ||
                              "Unavailable"}
                          </p>
                          <p>
                            <strong>Last modified:</strong>{" "}
                            {formatDate(violation.lastModified)}
                          </p>
                        </div>

                        {violation.inspectorComments && (
                          <details className="mt-4 rounded-lg bg-slate-50 p-3">
                            <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                              View inspector comments
                            </summary>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                              {violation.inspectorComments}
                            </p>
                          </details>
                        )}
                      </article>
                    ))}
                </div>
              )}

                             {activity === "311" && (
                 <p className="mt-5 text-xs leading-5 text-slate-500">
                   Source: City of Chicago 311 Service Requests (v6vf-nfxy).
                   Requests are reports, not confirmed findings or proof of current conditions.
                   Duplicate-flagged records may be included. Geographic results exclude
                   records without usable coordinates. When limited, the list and markers
                   show the newest 2,000 matches while the count reflects all matches.
                 </p>
               )}

               {activity === "violations" && (
                 <p className="mt-5 text-xs leading-5 text-slate-500">
                  Building violation statuses reflect the city's
                  published records and may have changed since
                  the last update. An open violation does not
                  necessarily indicate an immediate safety hazard.
                </p>
              )}

              {activity === "inspections" && (
                <p className="mt-5 text-xs leading-5 text-slate-500">
                  Food inspection results reflect individual
                  inspections and may not represent a business's
                  current compliance status.
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}


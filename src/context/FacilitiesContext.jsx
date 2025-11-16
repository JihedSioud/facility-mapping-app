import { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFilters } from "../hooks/useFilters.js";
import {
  deriveReferenceOptions,
  listEdits,
  listFacilities,
  listGovernorates,
  subscribeToFacilityChanges,
} from "../services/appwriteService.js";
import { FacilitiesContext } from "./baseContexts.js";

function aggregateByField(facilities, field) {
  return facilities.reduce((accumulator, facility) => {
    const key = facility[field] ?? "Unknown";
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

function buildTimeline(facilities) {
  const timeline = facilities.reduce((accumulator, facility) => {
    if (!facility.createdAt) {
      return accumulator;
    }
    const month = facility.createdAt.slice(0, 7);
    accumulator[month] = (accumulator[month] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.keys(timeline)
    .sort()
    .map((month) => ({ month, count: timeline[month] }));
}

function buildStats(facilities) {
  const STATUS_REPLACEMENTS = new Set([
    "تعمل ولكن لا يمكن الوصول اليه بسبب الوضع الأمني",
    "تعمل ولكن لا يمكن الوصول اليه لسبب أخر (يرجى التحديد)",
  ]);

  const normalizeStatus = (value) => {
    if (typeof value !== "string") {
      return value ?? "";
    }
    const trimmed = value.trim();
    if (STATUS_REPLACEMENTS.has(trimmed)) {
      return "تعمل";
    }
    return trimmed;
  };

  const isOperationalStatus = (status) => {
    const normalized = normalizeStatus(status);
    const lowered = normalized.toLowerCase();
    return (
      normalized === "تعمل" ||
      lowered === "active" ||
      lowered === "operational" ||
      lowered === "partially operational"
    );
  };

  const isPartiallyOperationalStatus = (status) => {
    const normalized = normalizeStatus(status);
    const lowered = normalized.toLowerCase();
    return (
      normalized === "تعمل بشكل جزئي" ||
      normalized === "متوقفة جزئياً" ||
      lowered === "partially operational"
    );
  };

  const isNotOperationalStatus = (status) => {
    const normalized = normalizeStatus(status);
    const lowered = normalized.toLowerCase();
    if (
      isOperationalStatus(normalized) ||
      isPartiallyOperationalStatus(normalized)
    ) {
      return false;
    }
    return (
      lowered === "inactive" ||
      lowered === "not operational" ||
      lowered === "suspended" ||
      lowered === "pending" ||
      normalized === "لا تعمل"
    );
  };

  const categorizeOwner = (owner) => {
    if (!owner) {
      return "Other / Unknown";
    }
    const value = owner.toString().trim().toLowerCase();
    if (
      value.includes("ministry") ||
      value.includes("moh") ||
      value.includes("government") ||
      value.includes("public")
    ) {
      return "Public";
    }
    if (
      value.includes("ngo") ||
      value.includes("n.g.o") ||
      value.includes("foundation") ||
      value.includes("association") ||
      value.includes("organization") ||
      value.includes("organisation") ||
      value.includes("relief") ||
      value.includes("red cross") ||
      value.includes("red crescent") ||
      value.includes("unicef") ||
      value.includes("unhcr") ||
      value.includes("who")
    ) {
      return "NGO / INGO";
    }
    if (
      value.includes("private") ||
      value.includes("company") ||
      value.includes("clinic") ||
      value.includes("hospital") ||
      value.includes("medical group") ||
      value.includes("enterprise")
    ) {
      return "Private";
    }
    return "Other / Unknown";
  };

  return {
    total: facilities.length,
    byGovernorate: aggregateByField(facilities, "governorate"),
    byType: aggregateByField(facilities, "facilityTypeLabel"),
    byStatus: aggregateByField(facilities, "facilityStatus"),
    byOwner: aggregateByField(facilities, "facilityOwner"),
    byOwnerCategory: aggregateByField(
      facilities,
      (facility) =>
        categorizeOwner(facility.facilityOwner ?? facility.Owner),
    ),
    timeline: buildTimeline(facilities),
    lastUpdated: facilities
      .map((facility) => facility.updatedAt)
      .filter(Boolean)
      .sort()
      .at(-1),
    operational: facilities.reduce((count, facility) => {
      const status = facility.facilityStatus ?? facility.STATUS ?? "";
      return isOperationalStatus(status) ? count + 1 : count;
    }, 0),
    partiallyOperational: facilities.reduce((count, facility) => {
      const status = facility.facilityStatus ?? facility.STATUS ?? "";
      return isPartiallyOperationalStatus(status) ? count + 1 : count;
    }, 0),
    notOperational: facilities.reduce((count, facility) => {
      const status = facility.facilityStatus ?? facility.STATUS ?? "";
      return isNotOperationalStatus(status) ? count + 1 : count;
    }, 0),
  };
}

export function FacilitiesProvider({ children }) {
  const { filters } = useFilters();
  const filterKey = JSON.stringify(filters);
  const queryClient = useQueryClient();
  const realtimeUnsubRef = useRef(null);

  const facilitiesQuery = useQuery({
    queryKey: ["facilities", filterKey],
    queryFn: () => listFacilities(filters),
    keepPreviousData: true,
    staleTime: 60 * 1000,
  });

  const allFacilitiesQuery = useQuery({
    queryKey: ["facilities", "unfiltered"],
    queryFn: () => listFacilities(),
    staleTime: 5 * 60 * 1000,
  });

  const governoratesQuery = useQuery({
    queryKey: ["governorates"],
    queryFn: () => listGovernorates(),
    staleTime: Infinity,
  });

  const recentActivityQuery = useQuery({
    queryKey: ["edits", 10],
    queryFn: () => listEdits({ limit: 10 }),
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    realtimeUnsubRef.current?.();
    realtimeUnsubRef.current = subscribeToFacilityChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
    });
    return () => realtimeUnsubRef.current?.();
  }, [queryClient]);

  const facilities = useMemo(
    () => facilitiesQuery.data?.documents ?? [],
    [facilitiesQuery.data],
  );
  const stats = useMemo(() => buildStats(facilities), [facilities]);
  const overallStats = useMemo(
    () =>
      buildStats(
        allFacilitiesQuery.data?.documents ?? facilities ?? [],
      ),
    [allFacilitiesQuery.data, facilities],
  );

  const referenceOptions = useMemo(
    () =>
      deriveReferenceOptions(
        allFacilitiesQuery.data?.documents ?? facilities ?? [],
      ),
    [allFacilitiesQuery.data, facilities],
  );

  const value = useMemo(
    () => ({
      facilities,
      stats,
      governorates: governoratesQuery.data ?? [],
      referenceOptions,
      recentActivity: recentActivityQuery.data ?? [],
      overallStats,
      isLoading: facilitiesQuery.isLoading,
      isFetching: facilitiesQuery.isFetching,
      error: facilitiesQuery.error ?? facilitiesQuery.data?.error ?? null,
      source: facilitiesQuery.data?.source ?? "mock",
      refetch: facilitiesQuery.refetch,
    }),
    [
      facilities,
      stats,
      overallStats,
      governoratesQuery.data,
      referenceOptions,
      recentActivityQuery.data,
      facilitiesQuery.isLoading,
      facilitiesQuery.isFetching,
      facilitiesQuery.error,
      facilitiesQuery.data,
      facilitiesQuery.refetch,
    ],
  );

  return (
    <FacilitiesContext.Provider value={value}>
      {children}
    </FacilitiesContext.Provider>
  );
}

FacilitiesProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFilters } from "../hooks/useFilters.js";
import {
  deriveReferenceOptions,
  listEdits,
  listFacilities,
  listGovernorates,
  subscribeToFacilityChanges,
} from "../services/appwriteService.js";

export const FacilitiesContext = createContext({
  facilities: [],
  stats: {},
  governorates: [],
  referenceOptions: {},
  recentActivity: [],
  isLoading: false,
  isFetching: false,
  error: null,
  source: "mock",
  refetch: () => {},
});

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
  return {
    total: facilities.length,
    byGovernorate: aggregateByField(facilities, "governorate"),
    byType: aggregateByField(facilities, "facilityTypeLabel"),
    byStatus: aggregateByField(facilities, "facilityStatus"),
    byOwner: aggregateByField(facilities, "facilityOwner"),
    timeline: buildTimeline(facilities),
    lastUpdated: facilities
      .map((facility) => facility.updatedAt)
      .filter(Boolean)
      .sort()
      .at(-1),
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

  const facilities = facilitiesQuery.data?.documents ?? [];
  const stats = useMemo(() => buildStats(facilities), [facilities]);

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
      isLoading: facilitiesQuery.isLoading,
      isFetching: facilitiesQuery.isFetching,
      error: facilitiesQuery.error ?? facilitiesQuery.data?.error ?? null,
      source: facilitiesQuery.data?.source ?? "mock",
      refetch: facilitiesQuery.refetch,
    }),
    [
      facilities,
      stats,
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

export function useFacilitiesContext() {
  const context = useContext(FacilitiesContext);
  if (!context) {
    throw new Error(
      "useFacilitiesContext must be used within FacilitiesProvider",
    );
  }
  return context;
}

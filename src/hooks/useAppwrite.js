import { useFacilitiesContext } from "./useFacilities.js";

export function useAppwrite() {
  const { governorates, referenceOptions } = useFacilitiesContext();
  const statuses =
    referenceOptions.statuses?.length > 0
      ? referenceOptions.statuses
      : [];
  return {
    governorates,
    facilityTypes: referenceOptions.facilityTypes ?? [],
    owners: referenceOptions.owners ?? [],
    affiliations: referenceOptions.affiliations ?? [],
    statuses,
  };
}

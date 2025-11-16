import { STATUS_OPTIONS } from "../utils/constants.js";
import { useFacilitiesContext } from "./useFacilities.js";

export function useAppwrite() {
  const { governorates, referenceOptions } = useFacilitiesContext();
  return {
    governorates,
    facilityTypes: referenceOptions.facilityTypes ?? [],
    owners: referenceOptions.owners ?? [],
    affiliations: referenceOptions.affiliations ?? [],
    statuses: STATUS_OPTIONS,
  };
}

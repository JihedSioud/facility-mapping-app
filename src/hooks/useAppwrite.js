import { STATUS_OPTIONS } from "../utils/constants.js";
import { useFacilitiesContext } from "../context/FacilitiesContext.jsx";

export function useAppwrite() {
  const { governorates, referenceOptions } = useFacilitiesContext();
  return {
    governorates,
    facilityTypes: referenceOptions.facilityTypes ?? [],
    owners: referenceOptions.owners ?? [],
    classifications: referenceOptions.classifications ?? [],
    statuses: STATUS_OPTIONS,
  };
}

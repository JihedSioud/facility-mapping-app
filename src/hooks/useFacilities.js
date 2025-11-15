import { useContext } from "react";
import { FacilitiesContext } from "../context/baseContexts.js";

export function useFacilitiesContext() {
  const context = useContext(FacilitiesContext);
  if (!context) {
    throw new Error(
      "useFacilitiesContext must be used within FacilitiesProvider",
    );
  }
  return context;
}

export function useFacilities() {
  return useFacilitiesContext();
}

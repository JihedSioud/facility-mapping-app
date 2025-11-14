import { useContext } from "react";
import { FiltersContext } from "../context/FiltersContext.jsx";

export function useFilters() {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error("useFilters must be used within FiltersProvider");
  }
  return context;
}

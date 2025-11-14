import { createContext, useMemo, useState } from "react";
import { FILTER_DEFAULTS } from "../utils/constants";

export const FiltersContext = createContext({
  filters: FILTER_DEFAULTS,
  setFilters: () => {},
  resetFilters: () => {},
});

export function FiltersProvider({ children }) {
  const [filters, setFilters] = useState(() => ({ ...FILTER_DEFAULTS }));

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      resetFilters: () => setFilters({ ...FILTER_DEFAULTS }),
    }),
    [filters],
  );

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  );
}

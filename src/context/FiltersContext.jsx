import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FILTER_DEFAULTS } from "../utils/constants";
import { FiltersContext } from "./baseContexts.js";

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

FiltersProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

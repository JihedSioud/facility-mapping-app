import { createContext } from "react";
import { FILTER_DEFAULTS } from "../utils/constants.js";

export const AuthContext = createContext({
  user: null,
  role: "visitor",
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isEditor: false,
  isAdmin: false,
});

export const FiltersContext = createContext({
  filters: FILTER_DEFAULTS,
  setFilters: () => {},
  resetFilters: () => {},
});

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

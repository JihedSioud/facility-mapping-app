export const STATUS_OPTIONS = ["active", "inactive", "pending", "suspended"];

export const EDIT_STATUS_OPTIONS = ["pending", "approved", "rejected"];

export const TYPE_OPTIONS = [
  "Hospital",
  "Clinic",
  "Laboratory",
  "Primary Health Center",
  "Specialized Center",
];

export const CLASSIFICATION_OPTIONS = ["Primary", "Secondary", "Tertiary"];

export const OWNER_OPTIONS = [
  "Ministry of Health",
  "Private",
  "NGO",
  "Military Medical Services",
];

export const FILTER_DEFAULTS = {
  searchTerm: "",
  governorate: "",
  statuses: [],
  facilityTypes: [],
  owners: [],
  classifications: [],
};

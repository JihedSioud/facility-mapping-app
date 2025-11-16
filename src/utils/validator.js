import { STATUS_OPTIONS } from "./constants.js";

export function validateFacility(data) {
  const errors = {};
  const requiredString = (value) =>
    typeof value === "string" && value.trim().length > 0;

  if (!requiredString(data.facilityName)) {
    errors.facilityName = "Facility name is required.";
  } else if (data.facilityName.trim().length > 255) {
    errors.facilityName = "Facility name must be 255 characters or fewer.";
  }

  if (data.establishmentName?.trim().length > 255) {
    errors.establishmentName =
      "Establishment name must be 255 characters or fewer.";
  }

  if (!requiredString(data.governorate)) {
    errors.governorate = "Governorate is required.";
  }

  if (!STATUS_OPTIONS.includes(data.facilityStatus)) {
    errors.facilityStatus = "Choose a valid status.";
  }

  if (!requiredString(data.facilityTypeLabel)) {
    errors.facilityTypeLabel = "Facility type is required.";
  }

  if (!requiredString(data.facilityOwner)) {
    errors.facilityOwner = "Facility owner is required.";
  }

  if (!requiredString(data.facilityAffiliation)) {
    errors.facilityAffiliation = "Affiliated organization is required.";
  }

  const lon = Number.parseFloat(data.longitude);
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    errors.longitude = "Longitude must be between -180 and 180 degrees.";
  }

  const lat = Number.parseFloat(data.latitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    errors.latitude = "Latitude must be between -90 and 90 degrees.";
  }

  return errors;
}

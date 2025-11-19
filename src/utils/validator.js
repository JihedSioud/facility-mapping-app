import { translateStatus } from "./statusTranslations.js";

function normalizeStatus(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  const translated = translateStatus(trimmed, "en");
  const lower = translated.toString().trim().toLowerCase();

  if (
    lower === "operational (unreachable due to security)" ||
    lower === "operational (unreachable for another reason)"
  ) {
    return "operational";
  }
  if (lower === "partially operational") {
    return "partially operational";
  }
  if (lower === "not operational" || lower === "inactive" || lower === "suspended") {
    return "not operational";
  }
  if (lower === "operational" || lower === "active") {
    return "operational";
  }

  return lower;
}

export function validateFacility(data, allowedStatuses = []) {
  const errors = {};
  const requiredString = (value) =>
    typeof value === "string" && value.trim().length > 0;
  const validStatuses = Array.isArray(allowedStatuses)
    ? allowedStatuses
    : [];
  const allowedStatusSet = new Set();
  validStatuses.forEach((status) => {
    if (status === undefined || status === null) return;
    const raw = status.toString().trim();
    if (!raw) return;
    allowedStatusSet.add(raw.toLowerCase());
    const normalized = normalizeStatus(raw);
    if (normalized) {
      allowedStatusSet.add(normalized);
    }
  });

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

  if (!requiredString(data.facilityStatus)) {
    errors.facilityStatus = "Status is required.";
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

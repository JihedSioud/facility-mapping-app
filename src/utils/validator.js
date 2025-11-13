export function validateFacility(data) {
  const errors = {};

  // Facility Name: required, non-empty, max 255 chars
  if (!data.facilityName || data.facilityName.trim().length === 0) {
    errors.facilityName = 'Facility name is required';
  } else if (data.facilityName.length > 255) {
    errors.facilityName = 'Facility name must be ≤ 255 characters';
  }

  // Governorate: required
  if (!data.governorate) {
    errors.governorate = 'Governorate is required';
  }

  // Facility Status: required, valid enum
  const validStatuses = ['active', 'inactive', 'pending', 'suspended'];
  if (!validStatuses.includes(data.facilityStatus)) {
    errors.facilityStatus = 'Invalid facility status';
  }

  // Longitude: required, valid range -180 to 180
  const lon = parseFloat(data.longitude);
  if (isNaN(lon) || lon < -180 || lon > 180) {
    errors.longitude = 'Longitude must be between -180 and 180';
  }

  // Latitude: required, valid range -90 to 90
  const lat = parseFloat(data.latitude);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.latitude = 'Latitude must be between -90 and 90';
  }

  return errors;
}

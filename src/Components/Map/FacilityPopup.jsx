import PropTypes from "prop-types";

export default function FacilityPopup({ facility }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="text-base font-semibold text-slate-900">
        {facility.facilityName}
      </p>
      {facility.establishmentName && (
        <p className="text-xs text-slate-500">{facility.establishmentName}</p>
      )}
      <dl className="mt-2 space-y-1">
        <div className="flex justify-between">
          <dt className="text-slate-500">Governorate</dt>
          <dd className="font-medium text-slate-800">{facility.governorate}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Type</dt>
          <dd className="font-medium text-slate-800">
            {facility.facilityTypeLabel}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium capitalize text-slate-800">
            {facility.facilityStatus}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Owner</dt>
          <dd className="font-medium text-slate-800">
            {facility.facilityOwner}
          </dd>
        </div>
      </dl>
    </div>
  );
}

FacilityPopup.propTypes = {
  facility: PropTypes.shape({
    facilityName: PropTypes.string,
    establishmentName: PropTypes.string,
    governorate: PropTypes.string,
    facilityTypeLabel: PropTypes.string,
    facilityStatus: PropTypes.string,
    facilityOwner: PropTypes.string,
  }).isRequired,
};

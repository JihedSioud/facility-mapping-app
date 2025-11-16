import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../hooks/useAuth.js";
import { useAppwrite } from "../../hooks/useAppwrite.js";
import { validateFacility } from "../../utils/validator.js";
import {
  getFacilityById,
  saveFacility,
} from "../../services/appwriteService.js";
import { translateStatuses } from "../../utils/statusTranslations.js";

const EMPTY_FORM = {
  facilityName: "",
  establishmentName: "",
  governorate: "",
  facilityStatus: "active",
  facilityTypeLabel: "",
  facilityOwner: "",
  facilityAffiliation: "",
  longitude: "",
  latitude: "",
};

export default function FacilityForm({ facilityId = null, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingFacility, setLoadingFacility] = useState(Boolean(facilityId));
  const [message, setMessage] = useState(null);
  const { governorates, facilityTypes, owners, affiliations, statuses } =
    useAppwrite();

  useEffect(() => {
    let isMounted = true;
    async function loadFacility() {
      if (!facilityId) {
        setLoadingFacility(false);
        return;
      }
      try {
        const document = await getFacilityById(facilityId);
        if (document && isMounted) {
          setForm(() => ({
            ...EMPTY_FORM,
            ...document,
          }));
        }
      } catch (error) {
        console.error("Unable to load facility", error);
        setMessage({
          type: "error",
          text: "Unable to load facility details.",
        });
      } finally {
        if (isMounted) {
          setLoadingFacility(false);
        }
      }
    }
    loadFacility();
    return () => {
      isMounted = false;
    };
  }, [facilityId]);

  const title = useMemo(
    () => (facilityId ? "Update facility" : "Add new facility"),
    [facilityId],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateFacility(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await saveFacility(form, {
        facilityId,
        userId: user?.$id,
      });
      setMessage({
        type: "success",
        text: facilityId
          ? "Facility updated successfully."
          : "Facility created successfully.",
      });
      if (!facilityId) {
        setForm({ ...EMPTY_FORM });
      }
      onSuccess?.();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.message ??
          "We were not able to save the facility. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Data management
          </p>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>
        {loadingFacility && (
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Loading…
          </span>
        )}
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-2 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Facility name *"
          name="facilityName"
          value={form.facilityName}
          onChange={handleChange}
          error={errors.facilityName}
        />
        <Field
          label="Establishment name"
          name="establishmentName"
          value={form.establishmentName}
          onChange={handleChange}
          error={errors.establishmentName}
        />
        <SelectField
          label="Governorate *"
          name="governorate"
          value={form.governorate}
          onChange={handleChange}
          options={governorates.map((governorate) => ({
            value: governorate.name_AR ?? governorate.name,
            label: governorate.name ?? governorate.name_AR,
          }))}
          error={errors.governorate}
        />
        <SelectField
          label="Status *"
          name="facilityStatus"
          value={form.facilityStatus}
          onChange={handleChange}
          options={translateStatuses(statuses)}
          error={errors.facilityStatus}
        />
        <SelectField
          label="Facility type *"
          name="facilityTypeLabel"
          value={form.facilityTypeLabel}
          onChange={handleChange}
          options={facilityTypes.map((type) => ({
            value: type,
            label: type,
          }))}
          error={errors.facilityTypeLabel}
        />
        <SelectField
          label="Owner *"
          name="facilityOwner"
          value={form.facilityOwner}
          onChange={handleChange}
          options={owners.map((owner) => ({
            value: owner,
            label: owner,
          }))}
          error={errors.facilityOwner}
        />
        <SelectField
          label="Affiliated to *"
          name="facilityAffiliation"
          value={form.facilityAffiliation}
          onChange={handleChange}
          options={affiliations.map((affiliation) => ({
            value: affiliation,
            label: affiliation,
          }))}
          error={errors.facilityAffiliation}
        />
        <Field
          label="Longitude *"
          name="longitude"
          type="number"
          step="0.0001"
          value={form.longitude}
          onChange={handleChange}
          error={errors.longitude}
        />
        <Field
          label="Latitude *"
          name="latitude"
          type="number"
          step="0.0001"
          value={form.latitude}
          onChange={handleChange}
          error={errors.latitude}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-400"
      >
        {submitting ? "Saving…" : facilityId ? "Update facility" : "Create facility"}
      </button>
    </form>
  );
}

function Field({ label, error, ...props }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        {...props}
        className={`w-full rounded-xl border px-4 py-2 text-sm focus:outline-none ${
          error
            ? "border-rose-500 focus:border-rose-500"
            : "border-slate-200 focus:border-emerald-500"
        }`}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </label>
  );
}

function SelectField({ label, options, error, ...props }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        {...props}
        className={`w-full rounded-xl border px-4 py-2 text-sm focus:outline-none ${
          error
            ? "border-rose-500 focus:border-rose-500"
            : "border-slate-200 focus:border-emerald-500"
        }`}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </label>
  );
}

FacilityForm.propTypes = {
  facilityId: PropTypes.string,
  onSuccess: PropTypes.func,
};

Field.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
};

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  error: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
};

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
import { useLanguage } from "../../context/LanguageContext.jsx";

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
  const { t, direction, locale } = useLanguage();
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
    () =>
      facilityId
        ? t("updateFacility", "Update facility")
        : t("createFacility", "Add new facility"),
    [facilityId, t],
  );

  const statusOptions = useMemo(() => {
    const merged = new Set(statuses.filter(Boolean));
    if (form.facilityStatus) {
      merged.add(form.facilityStatus);
    }
    return translateStatuses(Array.from(merged), locale);
  }, [statuses, form.facilityStatus, locale]);

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
    const validation = validateFacility(form, [...new Set([...statuses, form.facilityStatus])]);
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
        userName: user?.name ?? user?.email ?? "",
      });
      setMessage({
        type: "success",
        text: facilityId
          ? "Facility update submitted for review."
          : "Facility submitted for review.",
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
      className={`space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${
        direction === "rtl" ? "text-right" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">
            {t("dataManagement", "Data management")}
          </p>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>
        {loadingFacility && (
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            {t("loading", "Loading…")}
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
          label={t("facilityName", "Facility name *")}
          name="facilityName"
          value={form.facilityName}
          onChange={handleChange}
          error={errors.facilityName}
        />
        <Field
          label={t("establishmentName", "Establishment name")}
          name="establishmentName"
          value={form.establishmentName}
          onChange={handleChange}
          error={errors.establishmentName}
        />
        <SelectField
          label={`${t("governorate", "Governorate")} *`}
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
          label={`${t("status", "Status")} *`}
          name="facilityStatus"
          value={form.facilityStatus}
          onChange={handleChange}
          options={statusOptions}
          error={errors.facilityStatus}
        />
        <SelectField
          label={`${t("facilityType", "Facility type")} *`}
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
          label={`${t("owner", "Owner")} *`}
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
          label={`${t("affiliation", "Affiliated to")} *`}
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
          label={t("longitude", "Longitude *")}
          name="longitude"
          type="number"
          step="0.0001"
          value={form.longitude}
          onChange={handleChange}
          error={errors.longitude}
        />
        <Field
          label={t("latitude", "Latitude *")}
          name="latitude"
          type="number"
          step="0.0001"
          value={form.latitude}
          onChange={handleChange}
          error={errors.latitude}
        />
      </div>

      <div
        className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${
          direction === "rtl" ? "md:flex-row-reverse" : ""
        }`}
      >
        <div className="text-sm text-slate-600">
          <p className="font-semibold text-slate-800">
            {t("saveSubmit", "Save & submit changes")}
          </p>
          <p>
            {t(
              "saveSubmitSubtitle",
              "Updates are reviewed before they go live. Include accurate geo coordinates (longitude, latitude).",
            )}
          </p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:brightness-110 disabled:opacity-50"
        >
          {submitting
            ? t("saving", "Saving...")
            : facilityId
              ? t("updateFacility", "Update facility")
              : t("createFacility", "Create facility")}
        </button>
      </div>
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

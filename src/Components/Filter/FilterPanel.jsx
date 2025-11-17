import { useMemo } from "react";
import PropTypes from "prop-types";
import { useFilters } from "../../hooks/useFilters.js";
import { useAppwrite } from "../../hooks/useAppwrite.js";
import { translateStatuses } from "../../utils/statusTranslations.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { TYPE_TRANS } from "../../utils/optionTranslations.js";

export default function FilterPanel() {
  const { filters, setFilters, resetFilters } = useFilters();
  const { t, direction } = useLanguage();
  const { governorates, facilityTypes, owners, affiliations, statuses } =
    useAppwrite();
  const statusOptions = useMemo(
    () => translateStatuses(statuses, direction === "rtl" ? "ar" : "en"),
    [statuses, direction],
  );
  const facilityTypeOptions = useMemo(
    () =>
      facilityTypes.map((type) => {
        const key = type?.toString().trim().toLowerCase();
        const label =
          direction === "rtl" ? TYPE_TRANS[key] ?? type : type;
        return { value: type, label };
      }),
    [facilityTypes, direction],
  );

  const statsSummary = useMemo(
    () => ({
      status: filters.statuses.length,
      types: filters.facilityTypes.length,
      owners: filters.owners.length,
      affiliations: filters.affiliations.length,
    }),
    [filters],
  );

  const toggleValue = (key, value) => {
    setFilters({
      ...filters,
      [key]: filters[key].includes(value)
        ? filters[key].filter((item) => item !== value)
        : [...filters[key], value],
    });
  };

  return (
    <div
      className={`space-y-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-cyan-500/10 backdrop-blur ${
        direction === "rtl" ? "text-right" : ""
      }`}
    >
      <header>
        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">
          {t("filtersTitle", "Filters")}
        </p>
        <h2 className="text-xl font-semibold text-white">
          {t("filtersHeadline", "Target facilities quickly")}
        </h2>
      </header>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {t("searchByName", "Search by name")}
        </label>
        <input
          type="text"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          placeholder={t("searchPlaceholder", "Type to search...")}
          value={filters.searchTerm}
          onChange={(event) =>
            setFilters({ ...filters, searchTerm: event.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {t("governorate", "Governorate")}
        </label>
        <select
          value={filters.governorate}
          onChange={(event) =>
            setFilters({ ...filters, governorate: event.target.value })
          }
          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
        >
          <option value="">
            {direction === "rtl" ? "جميع المحافظات" : "All governorates"}
          </option>
          {governorates.map((governorate) => (
            <option
              key={governorate.$id}
              value={governorate.name_AR ?? governorate.name}
            >
              {direction === "rtl"
                ? governorate.name_AR ?? governorate.name
                : governorate.name ?? governorate.name_AR}
            </option>
          ))}
        </select>
      </div>

      <MultiSelectGroup
        label={t("status", "Status")}
        options={statusOptions}
        selected={filters.statuses}
        onToggle={(value) => toggleValue("statuses", value)}
        badgeText={
          statsSummary.status > 0
            ? `${statsSummary.status} ${t("selected", "selected")}`
            : t("all", "All")
        }
      />

      <MultiSelectGroup
        label={t("facilityType", "Facility type")}
        options={facilityTypeOptions}
        selected={filters.facilityTypes}
        onToggle={(value) => toggleValue("facilityTypes", value)}
        badgeText={
          statsSummary.types > 0
            ? `${statsSummary.types} ${t("selected", "selected")}`
            : t("all", "All")
        }
      />

      <MultiSelectGroup
        label={t("owner", "Owner")}
        options={owners}
        selected={filters.owners}
        onToggle={(value) => toggleValue("owners", value)}
        badgeText={
          statsSummary.owners > 0
            ? `${statsSummary.owners} ${t("selected", "selected")}`
            : t("all", "All")
        }
      />

      <MultiSelectGroup
        label={t("affiliation", "Affiliated to")}
        options={affiliations}
        selected={filters.affiliations}
        onToggle={(value) => toggleValue("affiliations", value)}
        badgeText={
          statsSummary.affiliations > 0
            ? `${statsSummary.affiliations} ${t("selected", "selected")}`
            : t("all", "All")
        }
      />

      <button
        type="button"
        onClick={resetFilters}
        className="w-full rounded-2xl border border-transparent bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:brightness-110"
      >
        {t("resetFilters", "Reset filters")}
      </button>
    </div>
  );
}

function MultiSelectGroup({
  label,
  options,
  selected,
  onToggle,
  badgeText = "",
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </label>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">
          {badgeText}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const display =
            typeof option === "string" ? option : option.label ?? option.value;
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-transparent bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow shadow-cyan-500/30"
                  : "border-white/15 text-slate-300 hover:border-cyan-400/60 hover:text-white"
              }`}
            >
              {display}
            </button>
          );
        })}
      </div>
    </div>
  );
}

MultiSelectGroup.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string,
      }),
    ]),
  ).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggle: PropTypes.func.isRequired,
  badgeText: PropTypes.string,
};

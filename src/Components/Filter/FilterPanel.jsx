import { useMemo } from "react";
import { useFilters } from "../../hooks/useFilters.js";
import { useAppwrite } from "../../hooks/useAppwrite.js";

export default function FilterPanel() {
  const { filters, setFilters, resetFilters } = useFilters();
  const { governorates, facilityTypes, owners, classifications, statuses } =
    useAppwrite();

  const statsSummary = useMemo(
    () => ({
      status: filters.statuses.length,
      types: filters.facilityTypes.length,
      owners: filters.owners.length,
      classifications: filters.classifications.length,
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
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header>
        <p className="text-xs uppercase tracking-wider text-slate-400">
          Filters
        </p>
        <h2 className="text-xl font-semibold text-slate-900">
          Target facilities quickly
        </h2>
      </header>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase text-slate-500">
          Search by name
        </label>
        <input
          type="text"
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
          placeholder="Type to search..."
          value={filters.searchTerm}
          onChange={(event) =>
            setFilters({ ...filters, searchTerm: event.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase text-slate-500">
          Governorate
        </label>
        <select
          value={filters.governorate}
          onChange={(event) =>
            setFilters({ ...filters, governorate: event.target.value })
          }
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All governorates</option>
          {governorates.map((governorate) => (
            <option key={governorate.$id} value={governorate.name}>
              {governorate.name}
            </option>
          ))}
        </select>
      </div>

      <MultiSelectGroup
        label="Status"
        options={statuses}
        selected={filters.statuses}
        onToggle={(value) => toggleValue("statuses", value)}
        badgeText={
          statsSummary.status > 0 ? `${statsSummary.status} selected` : "All"
        }
      />

      <MultiSelectGroup
        label="Facility type"
        options={facilityTypes}
        selected={filters.facilityTypes}
        onToggle={(value) => toggleValue("facilityTypes", value)}
        badgeText={
          statsSummary.types > 0 ? `${statsSummary.types} selected` : "All"
        }
      />

      <MultiSelectGroup
        label="Owner"
        options={owners}
        selected={filters.owners}
        onToggle={(value) => toggleValue("owners", value)}
        badgeText={
          statsSummary.owners > 0 ? `${statsSummary.owners} selected` : "All"
        }
      />

      <MultiSelectGroup
        label="Classification"
        options={classifications}
        selected={filters.classifications}
        onToggle={(value) => toggleValue("classifications", value)}
        badgeText={
          statsSummary.classifications > 0
            ? `${statsSummary.classifications} selected`
            : "All"
        }
      />

      <button
        type="button"
        onClick={resetFilters}
        className="w-full rounded-xl border border-transparent bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        Reset filters
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
        <label className="text-xs font-medium uppercase text-slate-500">
          {label}
        </label>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {badgeText}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

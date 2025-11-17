import { useMemo, useState } from "react";
import FacilityForm from "../Components/Facility/FacilityForm.jsx";
import RecentActivity from "../Components/Activity/RecentActivity.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useFacilities } from "../hooks/useFacilities.js";
import { useAppwrite } from "../hooks/useAppwrite.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function EditorConsole() {
  const { user } = useAuth();
  const { facilities } = useFacilities();
  const { governorates, facilityTypes } = useAppwrite();
  const { t, direction } = useLanguage();
  const [viewMode, setViewMode] = useState("create"); // 'create' | 'update'
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [govFilter, setGovFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectionMode, setSelectionMode] = useState("");

  const searchActive =
    selectionMode === "search" && searchTerm.trim().length > 1;

  const filteredFacilities = useMemo(() => {
    const term =
      selectionMode === "search" && searchActive
        ? searchTerm.trim().toLowerCase()
        : "";
    return facilities
      .filter((facility) => {
        if (selectionMode === "search" && searchActive) {
          const name =
            facility.facilityName ??
            facility.name ??
            "";
          return name.toLowerCase().includes(term);
        }
        if (selectionMode === "filter") {
          if (govFilter && facility.governorate !== govFilter) {
            return false;
          }
          if (typeFilter && facility.facilityTypeLabel !== typeFilter) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) =>
        (a.facilityName ?? a.name ?? "").localeCompare(
          b.facilityName ?? b.name ?? "",
        ),
      );
  }, [facilities, govFilter, typeFilter, searchTerm, searchActive, selectionMode]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedFacilityId("");
    setSearchTerm("");
    setGovFilter("");
    setTypeFilter("");
    setSelectionMode("");
  };

  return (
    <div
      className={`mx-auto max-w-5xl space-y-6 px-4 py-6 ${
        direction === "rtl" ? "text-right" : ""
      }`}
    >
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-slate-400">
          {t("editorWorkspace", "Editor workspace")}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t("submitOrUpdate", "Submit or update facility information")}
        </h1>
        {user && (
          <p className="text-sm text-slate-500">
            {t("signedInAs", "Signed in as ")}
            <span className="font-medium">{user.email}</span>
          </p>
        )}
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-slate-100 shadow-lg shadow-cyan-500/20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-200">
              {t("facilityEntry", "Facility entry")}
            </p>
            <h2 className="text-xl font-semibold text-white">
              {t("facilityEntryHeadline", "Add new facility or update existing one")}
            </h2>
            <p className="text-sm text-slate-300">
              {t(
                "facilityEntrySubtitle",
                "Save forms to submit for review and keep records current.",
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleViewModeChange("create")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                viewMode === "create"
                  ? "border-emerald-300 bg-emerald-500/10 text-emerald-100"
                  : "border-white/10 bg-slate-900/60 text-slate-200 hover:border-emerald-400"
              }`}
            >
              {t("addNewFacility", "Add New Facility")}
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("update")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                viewMode === "update"
                  ? "border-cyan-300 bg-cyan-500/10 text-cyan-100"
                  : "border-white/10 bg-slate-900/60 text-slate-200 hover:border-cyan-400"
              }`}
            >
              {t("updateExistingFacility", "Update Existing Facility")}
            </button>
          </div>
        </div>
        {viewMode === "update" && (
          <div className="mb-4 space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              {t("findFacility", "Choose how to find a facility")}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setSelectionMode("search");
                  setGovFilter("");
                  setTypeFilter("");
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  selectionMode === "search"
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                    : "border-white/10 bg-slate-900/40 text-slate-200 hover:border-cyan-400"
                }`}
              >
                {t("searchByName", "Search by name")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectionMode("filter");
                  setSearchTerm("");
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  selectionMode === "filter"
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                    : "border-white/10 bg-slate-900/40 text-slate-200 hover:border-cyan-400"
                }`}
              >
                {t("filterByGovType", "Filter by governorate/type")}
              </button>
            </div>
          </div>
        )}

        {viewMode === "update" && (
          <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-slate-100 lg:col-span-2">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
              {t("searchByName", "Search by name")}
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                if (event.target.value.trim().length > 0) {
                  setGovFilter("");
                  setTypeFilter("");
                }
              }}
              placeholder={t("searchPlaceholder", "Type at least 2 characters")}
              disabled={selectionMode !== "search"}
              className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
          <label className="text-sm text-slate-100">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
              {t("governorate", "Governorate")}
            </span>
            <select
              value={govFilter}
              onChange={(event) => {
                setGovFilter(event.target.value);
                setSearchTerm("");
              }}
              disabled={selectionMode !== "filter"}
              className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{direction === "rtl" ? "الكل" : t("all", "All")}</option>
              {governorates.map((gov) => (
                <option
                  key={gov.$id}
                  value={gov.name_AR ?? gov.name}
                >
                  {direction === "rtl"
                    ? gov.name_AR ?? gov.name
                    : gov.name ?? gov.name_AR}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-100">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
              {t("facilityType", "Facility type")}
            </span>
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setSearchTerm("");
              }}
              disabled={selectionMode !== "filter"}
              className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{t("all", "All")}</option>
              {facilityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {searchActive && selectionMode === "search" && (
              <p className="text-xs text-cyan-200">
                {t("searchActiveNote", "Search is active. Clear the search box to use filters.")}
              </p>
            )}
          </label>
         </div>
        )}
        {viewMode === "update" && (
          <div className="mb-4 grid gap-3 md:grid-cols-[2fr,1fr]">
            <label className="text-sm text-slate-100">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
                {t("selectFacilityUpdate", "Select an existing facility to update")}
              </span>
              <select
                value={selectedFacilityId}
                onChange={(event) => setSelectedFacilityId(event.target.value)}
                onBlur={() => {
                  if (!selectedFacilityId && filteredFacilities.length > 0) {
                    setSelectedFacilityId(filteredFacilities[0].$id);
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
              >
                {filteredFacilities.map((facility) => {
                  const name =
                    facility.facilityName || facility.name || facility.$id;
                  const type =
                    facility.facilityTypeLabel ||
                    facility.type ||
                    "Unknown type";
                  const gov = facility.governorate || "Unknown governorate";
                  return (
                    <option key={facility.$id} value={facility.$id}>
                      {`${name} — ${type} · ${gov}`}
                    </option>
                  );
                })}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="button"
              onClick={() => setSelectedFacilityId("")}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm font-semibold text-white transition hover:border-cyan-400 hover:text-cyan-200"
            >
              {t("startNewEntry", "Start new entry")}
            </button>
          </div>
          </div>
        )}
        {viewMode === "create" && (
          <div className="rounded-2xl border border-emerald-200/30 bg-emerald-50/10 p-4 shadow-inner shadow-emerald-500/20">
            <p className="text-xs uppercase tracking-wide text-emerald-200">
              {t("addNewLabel", "Add new")}
            </p>
            <h3 className="text-lg font-semibold text-white">
              {t("createFacilityCardTitle", "Create facility")}
            </h3>
            <p className="text-sm text-emerald-100/80">
              {t(
                "createFacilitySubtitle",
                "Start with a blank form to submit a new facility.",
              )}
            </p>
            <div className="mt-3">
              <FacilityForm facilityId={null} />
            </div>
          </div>
        )}
        {viewMode === "update" && (
          <div className="rounded-2xl border border-cyan-200/30 bg-cyan-50/10 p-4 shadow-inner shadow-cyan-500/20">
            <p className="text-xs uppercase tracking-wide text-cyan-200">
              {t("updateLabel", "Update")}
            </p>
            <h3 className="text-lg font-semibold text-white">
              {t("updateExistingTitle", "Update existing")}
            </h3>
            <p className="text-sm text-cyan-100/80">
              {t(
                "updateExistingSubtitle",
                "Load details for the selected facility and save updates.",
              )}
            </p>
            <div className="mt-3">
              <FacilityForm
                facilityId={
                  selectedFacilityId ||
                  (filteredFacilities.length > 0
                    ? filteredFacilities[0].$id
                    : null)
                }
              />
            </div>
          </div>
        )}
      </section>

      <RecentActivity
        title={t("yourRecentActivity", "Your recent activity")}
        limit={10}
        userId={user?.$id}
      />
    </div>
  );
}

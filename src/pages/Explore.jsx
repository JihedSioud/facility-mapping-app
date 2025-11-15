import FilterPanel from "../Components/Filter/FilterPanel.jsx";
import MapComponent from "../Components/Map/MapContainer.jsx";
import Dashboard from "../Components/Dashboard/Dashboard.jsx";
import RecentActivity from "../Components/Activity/RecentActivity.jsx";
import { useFacilities } from "../hooks/useFacilities.js";

export default function ExplorePage() {
  const { stats, source } = useFacilities();

  const highlights = [
    { label: "Facilities", value: stats.total ?? 0 },
    {
      label: "Active",
      value: stats.byStatus?.active ?? 0,
    },
    {
      label: "Governorates",
      value: Object.keys(stats.byGovernorate ?? {}).length,
    },
    {
      label: "Data source",
      value: source === "appwrite" ? "Live" : "Preview",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 text-slate-100 shadow-2xl shadow-cyan-500/20">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">
              Situational awareness
            </p>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              Monitor public health facilities across Syria in real time.
            </h1>
            <p className="text-sm text-slate-300">
              Filter the registry, inspect the interactive map, and review the
              latest edits without leaving this workspace.
            </p>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-2 md:w-auto md:grid-cols-4">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-center shadow-inner shadow-black/30"
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className="space-y-6">
          <FilterPanel />
          <RecentActivity />
        </div>
        <div className="space-y-6">
          <MapComponent />
          <Dashboard />
        </div>
      </div>
    </div>
  );
}

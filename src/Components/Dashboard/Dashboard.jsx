import PropTypes from "prop-types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { useFacilities } from "../../hooks/useFacilities.js";
import { translateStatus } from "../../utils/statusTranslations.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

const CHART_COLORS = [
  "#22d3ee",
  "#f97316",
  "#a855f7",
  "#38bdf8",
  "#22c55e",
];
const tooltipStyles = {
  backgroundColor: "rgba(15,23,42,0.95)",
  borderColor: "rgba(56,189,248,0.6)",
  borderRadius: 12,
  color: "#e2e8f0",
};

export default function Dashboard() {
  const { stats, isFetching, governorates } = useFacilities();
  const { t, direction } = useLanguage();
  const chartDir = "ltr"; // keep charts LTR to avoid label overlap in RTL

  const normalizeKey = (value) => (value ?? "").toString().trim().toLowerCase();
  const governorateNameMap = new Map(
    (governorates ?? []).flatMap((gov) => {
      const nameEn = gov.name ?? "";
      const nameAr = gov.name_AR ?? "";
      return [
        [normalizeKey(nameEn), direction === "rtl" ? nameAr || nameEn : nameEn || nameAr],
        [normalizeKey(nameAr), direction === "rtl" ? nameAr || nameEn : nameEn || nameAr],
      ];
    }),
  );
  const formatGovernorateLabel = (key) =>
    governorateNameMap.get(normalizeKey(key)) ?? key;
  const shortLabel = (label) =>
    label.length > 12 ? `${label.slice(0, 10)}…` : label;

  const governorateData = Object.entries(stats.byGovernorate ?? {}).map(
    ([name, count]) => ({
      name: formatGovernorateLabel(name),
      count,
      raw: name,
    }),
  );
  const typeData = Object.entries(stats.byType ?? {}).map(([name, count]) => ({
    name,
    value: count,
  }));
  const statusData = Object.entries(stats.byStatus ?? {}).map(
    ([name, count]) => ({ name, value: count }),
  );
  const ownershipData = Object.entries(stats.byOwnerCategory ?? {}).map(
    ([name, count]) => ({
      name,
      value: count,
    }),
  );
  const affiliationData = Object.entries(stats.byAffiliation ?? {}).map(
    ([name, count]) => ({
      name,
      value: count,
    }),
  );

  return (
    <section
      className={`space-y-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur ${
        direction === "rtl" ? "text-right" : ""
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">
            {t("analytics", "Analytics")}
          </p>
          <h2 className="text-xl font-semibold text-white">
            {t("facilityDashboard", "Facility dashboard")}
          </h2>
        </div>
        {isFetching && (
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Updating…
          </span>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("totalFacilities", "Total facilities")} value={stats.total} />
        <StatCard
          label={t("operationalFacilities", "Operational facilities")}
          value={stats.operational ?? 0}
        />
        <StatCard
          label={t("partiallyOperational", "Partially operational")}
          value={stats.partiallyOperational ?? 0}
        />
        <StatCard
          label={t("notOperational", "Not operational")}
          value={stats.notOperational ?? 0}
        />
        <StatCard
          label={t("governoratesCovered", "Governorates covered")}
          value={Object.keys(stats.byGovernorate ?? {}).length}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("chartByGovernorate", "Facilities by governorate")}>
          <div dir={chartDir}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={governorateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                    angle: -30,
                    textAnchor: "end",
                  }}
                  height={80}
                  stroke="#1f2937"
                  tickFormatter={shortLabel}
                  interval={0}
                />
                <YAxis allowDecimals={false} tick={{ fill: "#94a3b8" }} stroke="#1f2937" />
                <Tooltip contentStyle={tooltipStyles} itemStyle={{ color: "#e2e8f0" }} />
                <Bar dataKey="count" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("chartByType", "Facilities by type")}>
          <div dir={chartDir}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label={{ fill: "#e2e8f0", fontSize: 12 }}
                >
                  {typeData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyles} itemStyle={{ color: "#e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("chartByStatus", "Facilities by status")}>
          <div dir={chartDir}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={90}
                  paddingAngle={3}
                  label={({ name, value }) =>
                    `${translateStatus(name)}: ${value}`
                  }
                  labelStyle={{ fill: "#e2e8f0", fontSize: 12 }}
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyles} itemStyle={{ color: "#e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("chartByOwnership", "Facilities by ownership (equity view)")}>
          <div dir={chartDir}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ownershipData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={90}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelStyle={{ fill: "#e2e8f0", fontSize: 12 }}
                >
                  {ownershipData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyles} itemStyle={{ color: "#e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("chartByAffiliation", "Facilities by affiliation")}>
          <div dir={chartDir}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={affiliationData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={90}
                  paddingAngle={3}
                  label={false}
                >
                  {affiliationData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={48}
                  wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }}
                />
                <Tooltip contentStyle={tooltipStyles} itemStyle={{ color: "#e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("chartTimeline", "New facilities per month")}>
          <div dir={chartDir}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.timeline ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} stroke="#1f2937" />
                <YAxis allowDecimals={false} tick={{ fill: "#94a3b8" }} stroke="#1f2937" />
                <Tooltip contentStyle={tooltipStyles} itemStyle={{ color: "#e2e8f0" }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-3 shadow-inner shadow-black/40">
      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
        {label}
      </p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <article className="rounded-2xl border border-white/5 bg-slate-900/70 p-4 shadow-lg shadow-black/40">
      <h3 className="pb-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
        {title}
      </h3>
      {children}
    </article>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
};

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

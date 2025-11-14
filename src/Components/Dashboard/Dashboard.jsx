import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { useFacilities } from "../../hooks/useFacilities.js";

const CHART_COLORS = ["#0f766e", "#14b8a6", "#f97316", "#6366f1", "#e11d48"];

export default function Dashboard() {
  const { stats, isFetching } = useFacilities();

  const governorateData = Object.entries(stats.byGovernorate ?? {}).map(
    ([name, count]) => ({ name, count }),
  );
  const typeData = Object.entries(stats.byType ?? {}).map(([name, count]) => ({
    name,
    value: count,
  }));
  const statusData = Object.entries(stats.byStatus ?? {}).map(
    ([name, count]) => ({ name, value: count }),
  );

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Analytics
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            Facility dashboard
          </h2>
        </div>
        {isFetching && (
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Updating…
          </span>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total facilities" value={stats.total} />
        <StatCard
          label="Active facilities"
          value={stats.byStatus?.active ?? 0}
        />
        <StatCard
          label="Inactive facilities"
          value={stats.byStatus?.inactive ?? 0}
        />
        <StatCard
          label="Governorates covered"
          value={Object.keys(stats.byGovernorate ?? {}).length}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Facilities by governorate">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={governorateData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Facilities by type">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={typeData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {typeData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Facilities by status">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                outerRadius={90}
                paddingAngle={3}
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New facilities per month">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.timeline ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </article>
  );
}

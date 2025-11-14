import { useMemo } from "react";
import { useFacilities } from "../../hooks/useFacilities.js";

export default function RecentActivity({
  title = "Recent edits",
  limit = 5,
  userId,
  status,
}) {
  const { recentActivity } = useFacilities();
  const items = useMemo(() => {
    let data = recentActivity;
    if (userId) {
      data = data.filter((item) => item.userId === userId);
    }
    if (status) {
      data = data.filter((item) => item.status === status);
    }
    return data.slice(0, limit);
  }, [recentActivity, userId, status, limit]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((item) => (
          <li
            key={item.$id}
            className="rounded-xl border border-slate-100 px-4 py-3"
          >
            <p className="text-slate-900">
              <span className="font-semibold capitalize">{item.action}</span>{" "}
              {item.changes?.facilityName ?? item.facilityId}
            </p>
            <p className="text-xs text-slate-500">
              {new Date(item.timestamp).toLocaleString()} — status:{" "}
              <span className="font-semibold">{item.status}</span>
            </p>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="text-sm text-slate-500">No activity recorded yet.</p>
      )}
    </section>
  );
}

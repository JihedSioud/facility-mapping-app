import { useMemo } from "react";
import PropTypes from "prop-types";
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
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-sm shadow-xl shadow-cyan-500/10 backdrop-blur">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">
        {title}
      </h3>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((item) => (
          <li
            key={item.$id}
            className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 shadow-inner shadow-black/30"
          >
            <p className="text-white">
              <span className="font-semibold capitalize">{item.action}</span>{" "}
              {item.changes?.facilityName ?? item.facilityId}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(item.timestamp).toLocaleString()} — status:{" "}
              <span className="font-semibold">{item.status}</span>
            </p>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="text-sm text-slate-400">No activity recorded yet.</p>
      )}
    </section>
  );
}

RecentActivity.propTypes = {
  title: PropTypes.string,
  limit: PropTypes.number,
  userId: PropTypes.string,
  status: PropTypes.string,
};

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listEdits,
  updateEditStatus,
} from "../services/appwriteService.js";

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(null);
  const { data: pendingEdits = [], isLoading } = useQuery({
    queryKey: ["edits", "pending"],
    queryFn: () => listEdits({ status: "pending", limit: 50 }),
    refetchInterval: 30 * 1000,
  });

  const handleDecision = async (editId, status) => {
    try {
      setFeedback(null);
      await updateEditStatus(editId, status);
      setFeedback({ type: "success", text: `Edit ${status}.` });
      queryClient.invalidateQueries({ queryKey: ["edits", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["edits", 10] });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error?.message ?? "Unable to update edit status.",
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-slate-400">
          Admin
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Approval queue
        </h1>
        <p className="text-sm text-slate-500">
          Review pending facility submissions before they go live.
        </p>
      </header>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-2 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Pending edits
          </h2>
          {isLoading && (
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Loading…
            </span>
          )}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Facility</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Submitted by</th>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Decision</th>
              </tr>
            </thead>
            <tbody>
              {pendingEdits.map((edit) => (
                <tr
                  key={edit.$id}
                  className="border-t border-slate-100 text-slate-700"
                >
                  <td className="px-3 py-3 font-semibold">
                    {edit.changes?.facilityName ?? edit.facilityId}
                  </td>
                  <td className="px-3 py-3 capitalize">{edit.action}</td>
                  <td className="px-3 py-3">{edit.userId}</td>
                  <td className="px-3 py-3">
                    {new Date(edit.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecision(edit.$id, "approved")}
                        className="rounded-full border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(edit.$id, "rejected")}
                        className="rounded-full border border-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingEdits.length === 0 && !isLoading && (
            <p className="py-6 text-center text-sm text-slate-500">
              No pending edits at this time.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

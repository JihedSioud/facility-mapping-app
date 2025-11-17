import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listEdits,
  updateEditStatus,
  inviteUserToTeam,
} from "../services/appwriteService.js";
import { useAuth } from "../hooks/useAuth.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    team: "editor",
  });
  const { role } = useAuth();
  const { t, direction } = useLanguage();
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

  const handleInvite = async (event) => {
    event.preventDefault();
    try {
      setFeedback(null);
      await inviteUserToTeam({
        email: inviteForm.email,
        name: inviteForm.name,
        team: inviteForm.team,
        role: inviteForm.team === "admin" ? "admin" : "editor",
      });
      setInviteForm({ email: "", name: "", team: "editor" });
      setFeedback({
        type: "success",
        text: `Invitation sent to ${inviteForm.email} for ${inviteForm.team} team.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error?.message ?? "Unable to invite user.",
      });
    }
  };

  const canManageRoles = role === "admin";

  return (
    <div
      className={`mx-auto max-w-6xl space-y-6 px-4 py-6 ${
        direction === "rtl" ? "text-right" : ""
      }`}
    >
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-slate-400">
          {t("admin", "Admin")}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t("adminHeader", "Approval queue")}
        </h1>
        <p className="text-sm text-slate-500">
          {t(
            "adminSubheader",
            "Review pending facility submissions before they go live.",
          )}
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

      {canManageRoles && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("roleApprovals", "Role approvals")}
            </h2>
            <p className="text-xs uppercase tracking-wide text-emerald-600">
              {t("inviteTeams", "Invite to Admin / Editor teams")}
            </p>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {t(
              "inviteHelp",
              "Approve access requests by inviting a user to the appropriate team.",
            )}
          </p>
          <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleInvite}>
            <label className="text-sm text-slate-700 sm:col-span-2">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                {t("userEmail", "User email")}
              </span>
              <input
                type="email"
                required
                value={inviteForm.email}
                onChange={(event) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                {t("nameOptional", "Name (optional)")}
              </span>
              <input
                type="text"
                value={inviteForm.name}
                onChange={(event) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                {t("targetRole", "Target role")}
              </span>
              <select
                value={inviteForm.team}
                onChange={(event) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    team: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="editor">{t("editorConsole", "Editor")}</option>
                <option value="admin">{t("admin", "Admin")}</option>
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
              >
                {t("approveInvite", "Approve & Invite")}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("pendingEdits", "Pending edits")}
          </h2>
          {isLoading && (
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              {t("loadingEllipsis", "Loading…")}
            </span>
          )}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">{t("facility", "Facility")}</th>
                <th className="px-3 py-2">{t("action", "Action")}</th>
                <th className="px-3 py-2">{t("submittedBy", "Submitted by")}</th>
                <th className="px-3 py-2">{t("timestamp", "Timestamp")}</th>
                <th className="px-3 py-2">{t("decision", "Decision")}</th>
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
                        {t("approve", "Approve")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(edit.$id, "rejected")}
                        className="rounded-full border border-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        {t("reject", "Reject")}
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

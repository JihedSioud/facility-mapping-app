import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listEdits,
  updateEditStatus,
  inviteUserToTeam,
  listAccessRequests,
  updateAccessRequestStatus,
  addTeamMembershipDirect,
  deleteAccessRequest,
} from "../services/appwriteService.js";
import env from "../utils/env.js";
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
  const [selectedEdit, setSelectedEdit] = useState(null);
  const { data: pendingEdits = [], isLoading } = useQuery({
    queryKey: ["edits", "pending"],
    queryFn: () => listEdits({ status: "pending", limit: 50 }),
    refetchInterval: 30 * 1000,
  });
  const { data: accessRequests = [] } = useQuery({
    queryKey: ["accessRequests", "pending"],
    queryFn: () => listAccessRequests({ status: "pending", limit: 100 }),
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
      const teamId =
        inviteForm.team === "admin" ? env.adminsTeamId : env.editorsTeamId;
      const roles = inviteForm.team === "admin" ? ["admin"] : ["editor"];

      if (env.addTeamMembershipUrl && env.addTeamMembershipToken) {
        await addTeamMembershipDirect({
          teamId,
          email: inviteForm.email,
          roles,
        });
      } else {
        await inviteUserToTeam({
          email: inviteForm.email,
          name: inviteForm.name,
          team: inviteForm.team,
          role: roles[0],
        });
      }
      setInviteForm({ email: "", name: "", team: "editor" });
      setFeedback({
        type: "success",
        text: `Invitation sent to ${inviteForm.email} for ${inviteForm.team} team.`,
      });
      queryClient.invalidateQueries({ queryKey: ["accessRequests", "pending"] });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error?.message ?? "Unable to invite user.",
      });
    }
  };

  const handleInviteFromRequest = async (request, team) => {
    try {
      setFeedback(null);
      const teamId = team === "admin" ? env.adminsTeamId : env.editorsTeamId;
      const roles = team === "admin" ? ["admin"] : ["editor"];

      if (env.addTeamMembershipUrl && env.addTeamMembershipToken) {
        await addTeamMembershipDirect({
          teamId,
          email: request.email,
          roles,
        });
      } else {
        await inviteUserToTeam({
          email: request.email,
          name: request.name,
          team,
          role: roles[0],
        });
      }
      await updateAccessRequestStatus(request.$id, "invited");
      setFeedback({
        type: "success",
        text: `Invitation sent to ${request.email} for ${team} team.`,
      });
      queryClient.invalidateQueries({ queryKey: ["accessRequests", "pending"] });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error?.message ?? "Unable to invite user.",
      });
    }
  };

  const handleDeleteAccessRequest = async (requestId) => {
    try {
      setFeedback(null);
      await deleteAccessRequest(requestId);
      setFeedback({
        type: "success",
        text: "Access request removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["accessRequests", "pending"] });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error?.message ?? "Unable to remove access request.",
      });
    }
  };

  const decodeChanges = (rawChanges) => {
    if (!rawChanges) return {};
    if (typeof rawChanges === "object") {
      return rawChanges;
    }
    if (typeof rawChanges === "string") {
      try {
        const url = new URL(rawChanges);
        const param = url.searchParams.get("p");
        if (param) {
          const padded = (() => {
            const missing = param.length % 4;
            if (missing === 2) return `${param}==`;
            if (missing === 3) return `${param}=`;
            if (missing === 1) return `${param}===`;
            return param;
          })();
          const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
          const decoded =
            typeof atob === "function"
              ? decodeURIComponent(escape(atob(normalized)))
              : typeof Buffer !== "undefined"
                ? Buffer.from(normalized, "base64").toString("utf8")
                : "";
          const parsed = JSON.parse(decoded || "{}");
          if (parsed && typeof parsed === "object") {
            return parsed;
          }
        }
      } catch (error) {
        // fall through
      }
      try {
        const parsed = JSON.parse(rawChanges);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch (error) {
        return {};
      }
    }
    return {};
  };

  const selectedEditDetails = useMemo(
    () => (selectedEdit ? decodeChanges(selectedEdit.changes) : null),
    [selectedEdit],
  );

  const changeEntries = useMemo(() => {
    if (!selectedEditDetails || typeof selectedEditDetails !== "object") {
      return [];
    }
    return Object.entries(selectedEditDetails)
      .filter(([key]) => key !== "_meta")
      .map(([key, value]) => ({
        key,
        value:
          value === null || value === undefined
            ? "—"
            : typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : value,
      }));
  }, [selectedEditDetails]);

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

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-slate-900">
                {t("accessRequests", "Access requests")}
              </h3>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {t("pendingCount", "Pending")}: {accessRequests.length}
              </span>
            </div>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">{t("email", "Email")}</th>
                    <th className="px-3 py-2">{t("fullName", "Full name")}</th>
                    <th className="px-3 py-2">{t("timestamp", "Timestamp")}</th>
                    <th className="px-3 py-2">{t("decision", "Decision")}</th>
                  </tr>
                </thead>
                <tbody>
                  {accessRequests.map((request) => (
                  <tr
                    key={request.$id}
                    className="border-t border-slate-100 text-slate-700"
                  >
                    <td className="px-3 py-2">{request.email}</td>
                      <td className="px-3 py-2">{request.name || "—"}</td>
                      <td className="px-3 py-2">
                        {new Date(request.createdAt ?? request.$createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleInviteFromRequest(request, "editor")}
                            className="rounded-full border border-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
                          >
                            {t("inviteEditor", "Invite as Editor")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInviteFromRequest(request, "admin")}
                            className="rounded-full border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            {t("inviteAdmin", "Invite as Admin")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccessRequest(request.$id)}
                            className="rounded-full border border-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            {t("remove", "Remove")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {accessRequests.length === 0 && (
                <p className="py-4 text-sm text-slate-500">
                  {t("noAccessRequests", "No pending access requests.")}
                </p>
              )}
            </div>
          </div>
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
                  {(() => {
                    const decodedChanges = decodeChanges(edit.changes);
                    const submittedBy =
                      edit.userName ||
                      decodedChanges?._meta?.userName ||
                      edit.userId ||
                      "—";
                    const facilityLabel =
                      decodedChanges?.name ||
                      decodedChanges?.facilityName ||
                      edit.changes?.name ||
                      edit.changes?.facilityName ||
                      edit.facilityId;
                    return (
                      <>
                        <td className="px-3 py-3 font-semibold">
                          {facilityLabel}
                        </td>
                        <td className="px-3 py-3 capitalize">{edit.action}</td>
                        <td className="px-3 py-3">{submittedBy}</td>
                      </>
                    );
                  })()}
                  <td className="px-3 py-3">
                    {new Date(edit.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEdit(edit)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {t("view", "View")}
                      </button>
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

      {selectedEdit && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t("editDetails", "Edit details")}
              </h3>
              <p className="text-sm text-slate-500">
                {t("editDetailsSubtitle", "Pending change submitted by an editor.")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEdit(null)}
              className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
            >
              {t("close", "Close")}
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {t("facility", "Facility")}
              </p>
              <p className="font-semibold text-slate-900">
                {selectedEditDetails?.name ??
                  selectedEditDetails?.facilityName ??
                  selectedEdit.facilityId ??
                  "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {t("submittedBy", "Submitted by")}
              </p>
              <p className="font-semibold text-slate-900">
                {selectedEditDetails?._meta?.userName ||
                  selectedEdit.userName ||
                  selectedEdit.userId ||
                  "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {t("timestamp", "Timestamp")}
              </p>
              <p className="font-semibold text-slate-900">
                {new Date(selectedEdit.timestamp).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {t("action", "Action")}
              </p>
              <p className="font-semibold text-slate-900 capitalize">
                {selectedEdit.action}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t("changes", "Changes")}
            </p>
            {changeEntries.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                {t("noChangeDetails", "No change details available.")}
              </p>
            ) : (
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {changeEntries.map((entry) => (
                  <div
                    key={entry.key}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {entry.key}
                    </p>
                    <div className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-800">
                      {entry.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

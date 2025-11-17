import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ID } from "appwrite";
import { account, client, teams } from "../lib/appwrite";
import env from "../utils/env";
import { AuthContext } from "./baseContexts.js";

function resolveRoleFromMemberships(memberships = []) {
  const adminsTeamId = (env.adminsTeamId || "").trim();
  const editorsTeamId = (env.editorsTeamId || "").trim();

  const membershipIds = memberships.map((membership) =>
    (membership.teamId || "").trim(),
  );

  const hasAdminRole = memberships.some((membership) =>
    (membership.roles ?? []).some((role) =>
      ["owner", "admin", "administrator"].includes(role.toLowerCase()),
    ),
  );

  if ((adminsTeamId && membershipIds.includes(adminsTeamId)) || hasAdminRole) {
    return "admin";
  }

  if (editorsTeamId && membershipIds.includes(editorsTeamId)) {
    return "editor";
  }

  return membershipIds.length > 0 ? "editor" : "visitor";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("visitor");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearExistingSessions = useCallback(async () => {
    try {
      await account.deleteSessions();
    } catch (err) {
      // ignore if no session is active
    }
  }, []);

  const fetchUserContext = useCallback(async () => {
    const accountProfile = await account.get();
    const memberships = [];
    const addMembership = (membership) => {
      const teamId =
        membership.teamId ??
        membership.team?.$id ??
        membership.team?.id ??
        membership.$teamId ??
        "";
      const roles = membership.roles ?? [];
      if (!teamId) return;
      // Avoid duplicates
      if (memberships.some((m) => m.teamId === teamId)) return;
      memberships.push({ teamId, roles });
    };

    try {
      // Preferred: SDK helper
      const res = await account.listMemberships();
      (res.memberships ?? []).forEach(addMembership);
    } catch (sdkErr) {
      // Fallback to raw call (older SDKs may miss listMemberships)
      try {
        const res = await client.call("get", "/account/memberships");
        (res.memberships ?? []).forEach(addMembership);
      } catch (err) {
        console.warn("Unable to fetch account memberships", err);
      }
    }

    // Targeted fallback: check specific teams by ID to avoid empty membership lists
    const candidateTeamIds = [env.adminsTeamId, env.editorsTeamId]
      .map((id) => id?.trim())
      .filter(Boolean);

    for (const teamId of candidateTeamIds) {
      try {
        const res = await teams.listMemberships(teamId);
        const match = (res.memberships ?? []).find((membership) => {
          const userId =
            membership.userId ??
            membership.$userId ??
            membership.user?.$id ??
            membership.user?.id ??
            "";
          return userId && userId === accountProfile?.$id;
        });
        if (match) {
          addMembership(match);
        }
      } catch (err) {
        // Ignore 404/403; only warn unexpected errors
        if (err?.code && [403, 404].includes(err.code)) {
          continue;
        }
        console.warn(`Unable to fetch team memberships for team ${teamId}`, err);
      }
    }

    return { accountProfile, memberships };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const { accountProfile, memberships } = await fetchUserContext();
      setUser(accountProfile);
      setRole(resolveRoleFromMemberships(memberships));
      setError(null);
    } catch (err) {
      // For unauthenticated visitors, silently treat as visitor instead of surfacing an error.
      if (err?.code === 401 || err?.code === 403) {
        setUser(null);
        setRole("visitor");
        setError(null);
      } else {
        setUser(null);
        setRole("visitor");
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchUserContext]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async ({ email, password }) => {
      try {
        setLoading(true);
        setError(null);

        await clearExistingSessions();

        try {
          await account.createEmailPasswordSession(email, password);
        } catch (err) {
          // If a session already exists, refresh the user and continue.
          if (
            err?.code === 409 ||
            (typeof err?.message === "string" &&
              err.message.toLowerCase().includes("session is active"))
          ) {
            await refreshUser();
            return;
          }
          const message =
            err?.message ??
            "Invalid credentials. Please check the email and password.";
          setError({ ...err, message });
          throw err;
        }

        const { accountProfile, memberships } = await fetchUserContext();
        setUser(accountProfile);
        setRole(resolveRoleFromMemberships(memberships));
        setError(null);
      } catch (err) {
        const message =
          err?.message ??
          "Invalid credentials. Please check the email and password.";
        setError({ ...err, message });
      } finally {
        setLoading(false);
      }
    },
    [clearExistingSessions, fetchUserContext, refreshUser],
  );

  const register = useCallback(
    async ({ email, password, name }) => {
      setError(null);
      await account.create(ID.unique(), email, password, name);
      await clearExistingSessions();
      await account.createEmailPasswordSession(email, password);
      await refreshUser();
    },
    [clearExistingSessions, refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      await account.deleteSessions();
    } catch (err) {
      console.warn("Unable to terminate session", err);
    }
    setUser(null);
    setRole("visitor");
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: Boolean(user),
      isEditor: role === "editor" || role === "admin",
      isAdmin: role === "admin",
    }),
    [user, role, loading, error, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

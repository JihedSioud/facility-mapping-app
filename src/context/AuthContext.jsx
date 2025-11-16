import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ID } from "appwrite";
import { account, teams } from "../lib/appwrite";
import env from "../utils/env";
import { AuthContext } from "./baseContexts.js";

function resolveRoleFromMemberships(memberships = []) {
  const membershipIds = memberships.map((membership) => membership.teamId);
  const hasAdminRole = memberships.some((membership) =>
    (membership.roles ?? []).some((role) =>
      ["owner", "admin", "administrator"].includes(role.toLowerCase()),
    ),
  );

  if (
    (env.adminsTeamId && membershipIds.includes(env.adminsTeamId)) ||
    hasAdminRole
  ) {
    return "admin";
  }

  if (
    env.editorsTeamId &&
    membershipIds.includes(env.editorsTeamId)
  ) {
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

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const accountProfile = await account.get();
      const memberships = [];

      const addMemberships = (response = {}) => {
        (response.memberships ?? [])
          .filter(
            (membership) => membership.userId === accountProfile.$id,
          )
          .forEach((membership) => memberships.push(membership));
      };

      if (env.adminsTeamId) {
        try {
          const adminMemberships = await teams.listMemberships(
            env.adminsTeamId,
          );
          addMemberships(adminMemberships);
        } catch (err) {
          console.warn("Unable to load admin team memberships", err);
        }
      }

      if (env.editorsTeamId) {
        try {
          const editorMemberships = await teams.listMemberships(
            env.editorsTeamId,
          );
          addMemberships(editorMemberships);
        } catch (err) {
          console.warn("Unable to load editor team memberships", err);
        }
      }

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
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async ({ email, password }) => {
      setError(null);
      try {
        // If already authenticated, just refresh.
        const current = await account.get();
        if (current?.$id) {
          await refreshUser();
          return;
        }
      } catch (err) {
        // proceed to create session
      }

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
      await refreshUser();
    },
    [clearExistingSessions, refreshUser],
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

import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ID } from "appwrite";
import { account } from "../lib/appwrite";
import env from "../utils/env";
import { AuthContext } from "./baseContexts.js";

function resolveRoleFromMemberships(memberships = []) {
  const membershipIds = memberships.map((membership) => membership.teamId);
  if (
    env.adminsTeamId &&
    membershipIds.includes(env.adminsTeamId)
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

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const accountProfile = await account.get();
      const membershipResponse = await account.listMemberships();

      setUser(accountProfile);
      setRole(resolveRoleFromMemberships(membershipResponse.memberships ?? []));
      setError(null);
    } catch (err) {
      setUser(null);
      setRole("visitor");
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async ({ email, password }) => {
      await account.createEmailPasswordSession(email, password);
      await refreshUser();
    },
    [refreshUser],
  );

  const register = useCallback(
    async ({ email, password, name }) => {
      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      await refreshUser();
    },
    [refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      await account.deleteSessions();
    } catch (err) {
      console.warn("Unable to terminate session", err);
    }
    setUser(null);
    setRole("visitor");
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

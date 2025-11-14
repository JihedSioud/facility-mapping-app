import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import AuthPanel from "../Auth/AuthPanel.jsx";

const NAV_LINKS = [
  { to: "/", label: "Explore", roles: ["visitor", "editor", "admin"] },
  { to: "/editor", label: "Editor console", roles: ["editor", "admin"] },
  { to: "/admin", label: "Admin", roles: ["admin"] },
];

export default function AppHeader() {
  const { user, role, logout, loading } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Syrian PHC Platform
          </p>
          <p className="text-2xl font-semibold text-slate-900">
            Health Facilities GIS
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
          {NAV_LINKS.map((link) => {
            const allowed = link.roles.includes(role);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 ${
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  } ${allowed ? "" : "pointer-events-none opacity-40"}`
                }
              >
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{user.email}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {role}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          ) : loading ? (
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Checking session…
            </span>
          ) : (
            <details className="relative">
              <summary className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">
                Sign in
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-72">
                <AuthPanel />
              </div>
            </details>
          )}
        </div>
      </div>
    </header>
  );
}

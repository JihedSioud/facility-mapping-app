import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import AuthPanel from "../Auth/AuthPanel.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { translations } from "../../utils/i18n.js";

const NAV_LINKS = [
  { to: "/", label: "explore", roles: ["visitor", "editor", "admin"] },
  { to: "/editor", label: "editorConsole", roles: ["editor", "admin"] },
  { to: "/admin", label: "admin", roles: ["admin"] },
];

export default function AppHeader() {
  const { user, role, logout, loading } = useAuth();
  const { locale, setLocale, t } = useLanguage();

  return (
    <header className="relative z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-slate-100">
          <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/40">
            <span className="text-lg font-black leading-none">HF</span>
            <span className="text-[9px] font-semibold leading-none tracking-[0.15em]">
              SYR
            </span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/80">
              {t("headerTagline", "Syrian Health Facilities")}
            </p>
            <p className="text-2xl font-semibold text-white">
              {t("headerTitle", "Public Health GIS")}
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-300">
          {NAV_LINKS.map((link) => {
            const allowed = link.roles.includes(role);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow shadow-cyan-500/40"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  } ${allowed ? "" : "pointer-events-none opacity-30"}`
                }
              >
                {t(link.label, link.label)}
              </NavLink>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                locale === "en"
                  ? "border-cyan-300 bg-cyan-500/10 text-cyan-100"
                  : "border-white/10 text-slate-200 hover:border-cyan-400"
              }`}
            >
              {translations.en.langEn}
            </button>
            <button
              type="button"
              onClick={() => setLocale("ar")}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                locale === "ar"
                  ? "border-cyan-300 bg-cyan-500/10 text-cyan-100"
                  : "border-white/10 text-slate-200 hover:border-cyan-400"
              }`}
            >
              {translations.ar.langAr}
            </button>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-white">{user.email}</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-400">
                  {role}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" title="Signed in" />
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-white/10 px-4 py-2 font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
                >
                  {t("logOut", "Log out")}
                </button>
              </div>
            </div>
          ) : loading ? (
            <span className="text-xs uppercase tracking-wide text-slate-400">
              {t("checkingSession", "Checking session…")}
            </span>
          ) : (
            <details className="relative">
              <summary className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-semibold text-white transition hover:border-white/30 hover:bg-white/5">
                <span className="h-2 w-2 rounded-full bg-rose-400" title="Not signed in" />
                {t("signIn", "Sign in")}
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl shadow-cyan-500/20 backdrop-blur">
                <AuthPanel />
              </div>
            </details>
          )}
        </div>
      </div>
    </header>
  );
}

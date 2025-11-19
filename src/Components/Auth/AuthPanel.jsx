import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { createAccessRequest } from "../../services/appwriteService.js";

export default function AuthPanel() {
  const { login, register, loading, error: authError } = useAuth();
  const { t, direction } = useLanguage();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState(null);
  const [accessFeedback, setAccessFeedback] = useState(null);
  const isLogin = mode === "login";

  useEffect(() => {
    setError(authError?.message ?? null);
  }, [authError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setAccessFeedback(null);
    try {
      if (isLogin) {
        await login({
          email: form.email,
          password: form.password,
        });
      } else {
        await register({
          email: form.email,
          password: form.password,
          name: form.name,
        });
      }
      setForm({ email: "", password: "", name: "" });
    } catch (err) {
      setError(err?.message ?? "Unable to complete request.");
    }
  };

  const handleAccessRequest = async () => {
    setError(null);
    setAccessFeedback(null);
    if (!form.email) {
      setError(t("emailRequired", "Please enter your email to request access."));
      return;
    }
    try {
      await createAccessRequest({
        email: form.email,
        name: form.name,
      });
      setAccessFeedback(
        t(
          "accessRequested",
          "Access request submitted. An admin will invite you shortly.",
        ),
      );
    } catch (err) {
      setError(
        err?.message ??
          t("accessRequestFailed", "Unable to submit access request."),
      );
    }
  };

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-slate-900/95 p-4 text-sm text-white shadow-2xl shadow-cyan-500/20 ${
        direction === "rtl" ? "text-right" : ""
      }`}
    >
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setAccessFeedback(null);
          }}
          className={`flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold ${
            isLogin
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {t("signIn", "Sign in")}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
            setAccessFeedback(null);
          }}
          className={`flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold ${
            !isLogin
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {t("createAccount", "Create account")}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        {!isLogin && (
          <label className="block text-slate-100">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
              {t("fullName", "Full name")}
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              required
            />
          </label>
        )}
        <label className="block text-slate-100">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
            {t("email", "Email")}
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                email: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            required
          />
        </label>
        <label className="block text-slate-100">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
            {t("password", "Password")}
          </span>
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                password: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            required
            minLength={8}
          />
        </label>
        {error && (
          <p className="text-xs text-rose-400">
            {error}
          </p>
        )}
        {accessFeedback && (
          <p className="text-xs text-emerald-300">
            {accessFeedback}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-2 font-semibold text-white transition hover:brightness-110 disabled:bg-slate-500"
        >
          {loading
            ? t("pleaseWait", "Please wait…")
            : isLogin
              ? t("signIn", "Sign in")
              : t("createAccount", "Create account")}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleAccessRequest}
          className="w-full rounded-xl border border-cyan-400/60 px-3 py-2 font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:opacity-60"
        >
          {t("requestAccess", "Request access")}
        </button>
      </form>
    </div>
  );
}

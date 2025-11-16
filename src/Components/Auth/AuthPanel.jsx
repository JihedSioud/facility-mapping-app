import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";

export default function AuthPanel() {
  const { login, register, loading, error: authError } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState(null);
  const isLogin = mode === "login";

  useEffect(() => {
    setError(authError?.message ?? null);
  }, [authError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
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

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/95 p-4 text-sm text-white shadow-2xl shadow-cyan-500/20">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">
          {isLogin ? "Sign in" : "Create account"}
        </p>
        <button
          type="button"
          onClick={() => setMode(isLogin ? "register" : "login")}
          className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300"
        >
          {isLogin ? "Need access?" : "Have an account?"}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        {!isLogin && (
          <label className="block text-slate-100">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
              Full name
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
            Email
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
            Password
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
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-2 font-semibold text-white transition hover:brightness-110 disabled:bg-slate-500"
        >
          {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}

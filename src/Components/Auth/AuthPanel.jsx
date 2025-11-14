import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";

export default function AuthPanel() {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState(null);
  const isLogin = mode === "login";

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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">
          {isLogin ? "Sign in" : "Create account"}
        </p>
        <button
          type="button"
          onClick={() => setMode(isLogin ? "register" : "login")}
          className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
        >
          {isLogin ? "Need access?" : "Have an account?"}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        {!isLogin && (
          <label className="block text-slate-700">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              required
            />
          </label>
        )}
        <label className="block text-slate-700">
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
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
            className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            required
          />
        </label>
        <label className="block text-slate-700">
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
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
            className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            required
            minLength={8}
          />
        </label>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 px-3 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-400"
        >
          {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}

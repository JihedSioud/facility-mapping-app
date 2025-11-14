import FacilityForm from "../Components/Facility/FacilityForm.jsx";
import RecentActivity from "../Components/Activity/RecentActivity.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function EditorConsole() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-slate-400">
          Editor workspace
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Submit or update facility information
        </h1>
        {user && (
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-medium">{user.email}</span>
          </p>
        )}
      </header>

      <FacilityForm />

      <RecentActivity
        title="Your recent activity"
        limit={10}
        userId={user?.$id}
      />
    </div>
  );
}

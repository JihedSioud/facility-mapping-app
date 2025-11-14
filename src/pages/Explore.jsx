import FilterPanel from "../Components/Filter/FilterPanel.jsx";
import MapComponent from "../Components/Map/MapContainer.jsx";
import Dashboard from "../Components/Dashboard/Dashboard.jsx";
import RecentActivity from "../Components/Activity/RecentActivity.jsx";

export default function ExplorePage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[320px,1fr]">
      <div className="space-y-6">
        <FilterPanel />
        <RecentActivity />
      </div>
      <div className="space-y-6">
        <MapComponent />
        <Dashboard />
      </div>
    </div>
  );
}

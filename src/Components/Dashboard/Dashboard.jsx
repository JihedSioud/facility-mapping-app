import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFacilities } from '../hooks/useFacilities';

export default function Dashboard() {
  const { facilities } = useFacilities();
  const [stats, setStats] = useState({
    total: 0,
    byGovernorate: {},
    byType: {},
    byStatus: {},
    byOwner: {}
  });

  useEffect(() => {
    if (facilities.length === 0) return;

    const stats = {
      total: facilities.length,
      byGovernorate: {},
      byType: {},
      byStatus: {},
      byOwner: {}
    };

    facilities.forEach(f => {
      stats.byGovernorate[f.governorate] = (stats.byGovernorate[f.governorate] || 0) + 1;
      stats.byType[f.facilityTypeLabel] = (stats.byType[f.facilityTypeLabel] || 0) + 1;
      stats.byStatus[f.facilityStatus] = (stats.byStatus[f.facilityStatus] || 0) + 1;
      stats.byOwner[f.facilityOwner] = (stats.byOwner[f.facilityOwner] || 0) + 1;
    });

    setStats(stats);
  }, [facilities]);

  const governorateData = Object.entries(stats.byGovernorate).map(([name, count]) => ({ name, count }));
  const typeData = Object.entries(stats.byType).map(([name, count]) => ({ name, count }));
  const statusData = Object.entries(stats.byStatus).map(([name, count]) => ({ name, count }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Facility Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Facilities" value={stats.total} />
        <StatCard title="Active" value={stats.byStatus.active || 0} />
        <StatCard title="Inactive" value={stats.byStatus.inactive || 0} />
        <StatCard title="Governorates" value={Object.keys(stats.byGovernorate).length} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* By Governorate */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Facilities by Governorate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={governorateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Type */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Facilities by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By Status */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Facilities by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-blue-600">{value}</p>
    </div>
  );
}

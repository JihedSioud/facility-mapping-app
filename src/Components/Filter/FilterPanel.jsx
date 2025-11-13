import React from 'react';
import { useFilters } from '../hooks/useFilters';
import { useAppwrite } from '../hooks/useAppwrite';

export default function FilterPanel() {
  const { filters, setFilters } = useFilters();
  const { governorates, facilityTypes, statuses } = useAppwrite();

  return (
    <div className="w-full max-w-md p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-lg font-bold mb-4">Filters</h2>

      {/* Search Box */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Search Facility Name</label>
        <input
          type="text"
          placeholder="Search by name..."
          value={filters.searchTerm}
          onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Governorate Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Governorate</label>
        <select
          value={filters.governorate}
          onChange={(e) => setFilters({ ...filters, governorate: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Governorates</option>
          {governorates.map(g => (
            <option key={g.$id} value={g.name}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Status</label>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Statuses</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Type Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Facility Type</label>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Types</option>
          {facilityTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => setFilters({
          governorate: '',
          status: '',
          type: '',
          owner: '',
          searchTerm: ''
        })}
        className="w-full bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
      >
        Reset Filters
      </button>
    </div>
  );
}

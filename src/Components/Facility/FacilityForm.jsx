import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { databases } from '../services/appwrite-client';
import { validateFacility } from '../utils/validators';

export default function FacilityForm({ facilityId = null, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    facilityName: '',
    establishmentName: '',
    governorate: '',
    facilityStatus: 'active',
    facilityTypeLabel: '',
    facilityOwner: '',
    facilityClassification: '',
    facilityAffiliation: '',
    longitude: '',
    latitude: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Load existing facility if editing
  useEffect(() => {
    if (facilityId) {
      async function loadFacility() {
        try {
          const doc = await databases.getDocument('database-id', 'facilities', facilityId);
          setFormData(doc);
        } catch (err) {
          console.error('Error loading facility:', err);
        }
      }
      loadFacility();
    }
  }, [facilityId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateFacility(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      if (facilityId) {
        // Update existing
        await databases.updateDocument('database-id', 'facilities', facilityId, {
          ...formData,
          lastEditedBy: user.$id,
          updatedAt: new Date().toISOString()
        });
        // Log edit
        await databases.createDocument('database-id', 'edits_log', 'unique()', {
          facilityId,
          action: 'updated',
          userId: user.$id,
          changes: formData,
          timestamp: new Date().toISOString(),
          status: 'approved'
        });
      } else {
        // Create new
        const doc = await databases.createDocument('database-id', 'facilities', 'unique()', {
          ...formData,
          createdBy: user.$id,
          lastEditedBy: user.$id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        // Log creation
        await databases.createDocument('database-id', 'edits_log', 'unique()', {
          facilityId: doc.$id,
          action: 'created',
          userId: user.$id,
          changes: formData,
          timestamp: new Date().toISOString(),
          status: 'approved'
        });
      }
      
      onSuccess?.();
      alert(facilityId ? 'Facility updated successfully!' : 'Facility created successfully!');
    } catch (err) {
      console.error('Submission error:', err);
      alert('Error saving facility: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">{facilityId ? 'Edit Facility' : 'Add New Facility'}</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Facility Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Facility Name *</label>
          <input
            type="text"
            name="facilityName"
            value={formData.facilityName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {errors.facilityName && <span className="text-red-500 text-xs">{errors.facilityName}</span>}
        </div>

        {/* Establishment Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Establishment Name</label>
          <input
            type="text"
            name="establishmentName"
            value={formData.establishmentName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Governorate */}
        <div>
          <label className="block text-sm font-medium mb-1">Governorate *</label>
          <select
            name="governorate"
            value={formData.governorate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Governorate</option>
            {/* Populate from governorates collection */}
          </select>
          {errors.governorate && <span className="text-red-500 text-xs">{errors.governorate}</span>}
        </div>

        {/* Facility Status */}
        <div>
          <label className="block text-sm font-medium mb-1">Status *</label>
          <select
            name="facilityStatus"
            value={formData.facilityStatus}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Type, Owner, Classification, Affiliation... (similar pattern) */}

        {/* Longitude */}
        <div>
          <label className="block text-sm font-medium mb-1">Longitude *</label>
          <input
            type="number"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            step="0.0001"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {errors.longitude && <span className="text-red-500 text-xs">{errors.longitude}</span>}
        </div>

        {/* Latitude */}
        <div>
          <label className="block text-sm font-medium mb-1">Latitude *</label>
          <input
            type="number"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            step="0.0001"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {errors.latitude && <span className="text-red-500 text-xs">{errors.latitude}</span>}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Saving...' : 'Save Facility'}
      </button>
    </form>
  );
}

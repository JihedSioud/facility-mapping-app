import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { useFacilities } from '../hooks/useFacilities';
import { useFilters } from '../hooks/useFilters';
import FacilityPopup from './FacilityPopup';

export default function MapComponent() {
  const { facilities, loading } = useFacilities();
  const { filters } = useFilters();
  const [filteredFacilities, setFilteredFacilities] = useState([]);

  useEffect(() => {
    // Filter facilities based on active filters
    const filtered = facilities.filter(f => {
      if (filters.governorate && f.governorate !== filters.governorate) return false;
      if (filters.status && f.facilityStatus !== filters.status) return false;
      if (filters.type && f.facilityTypeLabel !== filters.type) return false;
      if (filters.owner && !f.facilityOwner.includes(filters.owner)) return false;
      if (filters.searchTerm && 
          !f.facilityName.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
          !f.establishmentName.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
    setFilteredFacilities(filtered);
  }, [facilities, filters]);

  const mapCenter = [36.7372, 10.3375]; // Tunisia center
  const mapZoom = 7;

  return (
    <div className="w-full h-full">
      {loading && <div className="absolute top-4 left-4 bg-white p-2 rounded shadow">Loading facilities...</div>}
      
      <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Render markers for filtered facilities */}
        {filteredFacilities.map(facility => (
          <Marker
            key={facility.$id}
            position={[facility.latitude, facility.longitude]}
            icon={getIconByType(facility.facilityTypeLabel)}
          >
            <Popup>
              <FacilityPopup facility={facility} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function getIconByType(type) {
  // Color-coded icons by facility type
  const colors = {
    Hospital: 'red',
    Clinic: 'blue',
    Lab: 'green',
    'Primary Health Center': 'orange'
  };
  const color = colors[type] || 'gray';
  
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });
}

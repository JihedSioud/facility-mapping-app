import { useEffect, useMemo } from "react";
import { MapContainer as LeafletMap, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import FacilityPopup from "./FacilityPopup.jsx";
import { useFacilities } from "../../hooks/useFacilities.js";

const TYPE_COLORS = {
  Hospital: "red",
  Clinic: "blue",
  Laboratory: "green",
  "Primary Health Center": "orange",
  "Specialized Center": "purple",
};

const DEFAULT_ICON = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -28],
});

function getIconByType(type) {
  const color = TYPE_COLORS[type] ?? "grey";
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -28],
    shadowUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png",
    shadowSize: [41, 41],
  });
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapComponent() {
  const { facilities, isLoading } = useFacilities();

  const markers = useMemo(
    () =>
      facilities
        .map((facility) => {
          const latitude = Number.parseFloat(facility.latitude);
          const longitude = Number.parseFloat(facility.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }
          return {
            ...facility,
            position: [latitude, longitude],
          };
        })
        .filter(Boolean),
    [facilities],
  );

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {isLoading && (
        <div className="absolute left-4 top-4 z-[1000] rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow">
          Loading facilities...
        </div>
      )}

      <LeafletMap center={[34.8021, 38.9968]} zoom={6} minZoom={4} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusteredMarkers markers={markers} />
      </LeafletMap>
    </div>
  );
}

function ClusteredMarkers({ markers }) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      polygonOptions: { stroke: false, fillColor: "#059669" },
    });

    markers.forEach((facility) => {
      const marker = L.marker(facility.position, {
        icon: getIconByType(facility.facilityTypeLabel) ?? DEFAULT_ICON,
      });
      marker.bindPopup(renderToString(<FacilityPopup facility={facility} />));
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
      clusterGroup.clearLayers();
    };
  }, [map, markers]);

  return null;
}

import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { MapContainer as LeafletMap, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import FacilityPopup from "./FacilityPopup.jsx";
import { useFacilities } from "../../hooks/useFacilities.js";
import { useFilters } from "../../hooks/useFilters.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

const TYPE_COLORS = {
  Hospital: "red",
  Clinic: "blue",
  Laboratory: "green",
  "Primary Health Center": "orange",
  "Specialized Center": "purple",
};

const BASE_LAYERS = [
  {
    id: "cartoDark",
    name: "Carto Dark",
    name_ar: "كارتو داكن",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  },
  {
    id: "cartoLight",
    name: "Carto Light",
    name_ar: "كارتو فاتح",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  },
  {
    id: "osm",
    name: "OSM Standard",
    name_ar: "خريطة OSM القياسية",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ["a", "b", "c"],
    maxZoom: 19,
  },
  {
    id: "satellite",
    name: "Esri Satellite",
    name_ar: "إسري ساتلايت",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
  },
];

const DEFAULT_ICON = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -28],
});

function getIconByType(type, markerTheme = "byType") {
  const color =
    markerTheme === "single" ? "teal" : TYPE_COLORS[type] ?? "grey";
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
  const { facilities, governorates, isLoading } = useFacilities();
  const { filters } = useFilters();
  const { t, direction } = useLanguage();
  const [baseLayerKey, setBaseLayerKey] = useState("cartoDark");
  const [markerTheme, setMarkerTheme] = useState("byType");
  const mapRef = useRef(null);
  const boundariesRef = useRef(null);

  const selectedBaseLayer =
    BASE_LAYERS.find((layer) => layer.id === baseLayerKey) ?? BASE_LAYERS[0];

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

  const normalizeGovernorate = (value) =>
    (value ?? "").toString().trim().toLowerCase();
  const selectedGovernorate = normalizeGovernorate(filters?.governorate);

  const boundariesData = useMemo(() => {
    const features = (governorates ?? [])
      .map((gov) => {
        const geometry =
          typeof gov.boundary === "string"
            ? (() => {
                try {
                  return JSON.parse(gov.boundary);
                } catch (error) {
                  return null;
                }
              })()
            : gov.boundary;
        if (!geometry) {
          return null;
        }
        const normalizedNames = [
          gov.name,
          gov.name_AR,
          gov.governorate,
        ]
          .filter(Boolean)
          .map((value) => normalizeGovernorate(value));

        return {
          type: "Feature",
          geometry,
          properties: {
            name: gov.name,
            name_AR: gov.name_AR,
            governorate: gov.name,
            normalizedNames,
          },
        };
      })
      .filter(Boolean);

    if (!features.length) {
      return null;
    }

    return {
      type: "FeatureCollection",
      features,
    };
  }, [governorates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !boundariesData) {
      return;
    }

    if (boundariesRef.current) {
      map.removeLayer(boundariesRef.current);
      boundariesRef.current = null;
    }

    const matchGovernorate = (feature) => {
      const props = feature?.properties ?? {};
      const candidates = [
        ...(props.normalizedNames ?? []),
        props.governorate,
        props.GOVERNORATE,
        props.NAME,
        props.Name,
        props.name,
        props.NAME_EN,
        props.NAME_ENGLISH,
        props.name_en,
        props.NAME_AR,
        props.name_ar,
      ]
        .filter(Boolean)
        .map((value) => normalizeGovernorate(value));

      if (!selectedGovernorate.length) {
        return true;
      }
      return candidates.includes(selectedGovernorate);
    };

    const layer = L.geoJSON(boundariesData, {
      style: (feature) => {
        const isMatch = matchGovernorate(feature);
        return {
          color: isMatch ? "#22d3ee" : "#22d3ee33",
          weight: isMatch ? 2 : 0.5,
          fillColor: "#22d3ee",
          fillOpacity: isMatch ? 0.08 : 0,
        };
      },
    });

    layer.addTo(map);
    boundariesRef.current = layer;

    return () => {
      if (boundariesRef.current) {
        map.removeLayer(boundariesRef.current);
        boundariesRef.current = null;
      }
    };
  }, [boundariesData, selectedGovernorate]);

  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;
    map.closePopup();
    map.setView([34.8021, 38.9968], 6);
  };

  const handleFitToFacilities = () => {
    const map = mapRef.current;
    if (!map || markers.length === 0) {
      return;
    }
    const bounds = L.latLngBounds(markers.map((marker) => marker.position));
    map.closePopup();
    map.fitBounds(bounds, { padding: [40, 40] });
  };

  const handleToggleTheme = () => {
    setBaseLayerKey((current) =>
      current === "cartoDark" ? "cartoLight" : "cartoDark",
    );
  };

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 shadow-2xl shadow-cyan-500/20">
      {isLoading && (
        <div className="absolute left-4 top-4 z-[1000] rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-medium text-white shadow">
          Loading facilities...
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent mix-blend-overlay" />

      <MapControls
        baseLayerKey={baseLayerKey}
        onBaseLayerChange={setBaseLayerKey}
        markerTheme={markerTheme}
        onMarkerThemeChange={setMarkerTheme}
        onToggleTheme={handleToggleTheme}
        onResetView={handleResetView}
        onFitToFacilities={handleFitToFacilities}
        t={t}
        direction={direction}
      />

      <LeafletMap
        center={[34.8021, 38.9968]}
        zoom={6}
        minZoom={4}
        ref={mapRef}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          key={selectedBaseLayer.id}
          attribution={selectedBaseLayer.attribution}
          url={selectedBaseLayer.url}
          subdomains={selectedBaseLayer.subdomains}
          maxZoom={selectedBaseLayer.maxZoom ?? 19}
          detectRetina
        />
        <ClusteredMarkers markers={markers} markerTheme={markerTheme} />
      </LeafletMap>
    </div>
  );
}

function ClusteredMarkers({ markers, markerTheme }) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      polygonOptions: { stroke: false, fillColor: "#22d3ee" },
    });

    markers.forEach((facility) => {
      const marker = L.marker(facility.position, {
        icon:
          getIconByType(facility.facilityTypeLabel, markerTheme) ?? DEFAULT_ICON,
      });
      marker.bindPopup(renderToString(<FacilityPopup facility={facility} />));
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
      clusterGroup.clearLayers();
    };
  }, [map, markers, markerTheme]);

  return null;
}

ClusteredMarkers.propTypes = {
  markers: PropTypes.arrayOf(
    PropTypes.shape({
      $id: PropTypes.string,
      position: PropTypes.arrayOf(PropTypes.number).isRequired,
      facilityTypeLabel: PropTypes.string,
    }),
  ).isRequired,
  markerTheme: PropTypes.oneOf(["byType", "single"]).isRequired,
};

function MapControls({
  baseLayerKey,
  onBaseLayerChange,
  markerTheme,
  onMarkerThemeChange,
  onToggleTheme,
  onResetView,
  onFitToFacilities,
  t,
  direction,
}) {
  return (
    <div
      className={`absolute right-4 top-4 z-[1100] flex w-64 flex-col gap-3 rounded-2xl bg-slate-900/80 p-4 text-white shadow-xl shadow-cyan-500/20 backdrop-blur ${
        direction === "rtl" ? "text-right" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
          {t("mapControls", "Map Controls")}
        </h3>
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-full border border-white/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide hover:border-cyan-400 hover:text-cyan-200"
        >
          {baseLayerKey === "cartoDark"
            ? t("light", "Light")
            : t("dark", "Dark")}
        </button>
      </div>

      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {t("baseLayer", "Base layer")}
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
          value={baseLayerKey}
          onChange={(event) => onBaseLayerChange(event.target.value)}
        >
          {BASE_LAYERS.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {direction === "rtl" ? layer.name_ar ?? layer.name : layer.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {t("markerStyle", "Marker style")}
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
          value={markerTheme}
          onChange={(event) => onMarkerThemeChange(event.target.value)}
        >
          <option value="byType">{t("colorByType", "Color by type")}</option>
          <option value="single">{t("singleColor", "Single color")}</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onResetView}
          className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:border-cyan-400 hover:text-cyan-200"
        >
          {t("resetView", "Reset view")}
        </button>
        <button
          type="button"
          onClick={onFitToFacilities}
          className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:border-cyan-400 hover:text-cyan-200"
        >
          {t("fitToData", "Fit to data")}
        </button>
      </div>
    </div>
  );
}

MapControls.propTypes = {
  baseLayerKey: PropTypes.string.isRequired,
  onBaseLayerChange: PropTypes.func.isRequired,
  markerTheme: PropTypes.oneOf(["byType", "single"]).isRequired,
  onMarkerThemeChange: PropTypes.func.isRequired,
  onToggleTheme: PropTypes.func.isRequired,
  onResetView: PropTypes.func.isRequired,
  onFitToFacilities: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  direction: PropTypes.oneOf(["rtl", "ltr"]).isRequired,
};

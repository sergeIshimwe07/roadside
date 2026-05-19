import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Service } from "@/hooks/useServices";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const categoryIcons: Record<string, L.Icon> = {
  garage: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
  }),
  clinic: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
  }),
  lodge: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
  }),
};

const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      map.setView([lat, lng], 14);
      hasInitialized.current = true;
    }
  }, [lat, lng, map]);
  return null;
}

interface MapViewProps {
  userLat: number;
  userLng: number;
  services: (Service & { distance: number })[];
  onServiceClick?: (service: Service) => void;
}

export default function MapView({ userLat, userLng, services, onServiceClick }: MapViewProps) {
  return (
    <MapContainer
      center={[userLat, userLng]}
      zoom={14}
      className="h-full w-full z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <RecenterMap lat={userLat} lng={userLng} />
      <Marker position={[userLat, userLng]} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>
      {services.map((s) => (
        <Marker
          key={s.id}
          position={[s.latitude, s.longitude]}
          icon={categoryIcons[s.category] || categoryIcons.garage}
          eventHandlers={{ click: () => onServiceClick?.(s) }}
        >
          <Popup>
            <strong>{s.name}</strong>
            <br />
            {s.category} · {s.distance.toFixed(1)} km
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

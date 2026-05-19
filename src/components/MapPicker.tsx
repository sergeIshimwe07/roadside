import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pickerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const hasCoords = !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0;
  const center: [number, number] = hasCoords ? [latitude, longitude] : [-1.2921, 36.8219];

  return (
    <div className="h-[250px] sm:h-[250px] w-full rounded-md overflow-hidden border border-border touch-none">
      <MapContainer center={center} zoom={hasCoords ? 14 : 12} className="h-full w-full z-0" zoomControl={true} dragging={true} touchZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ClickHandler onPick={onChange} />
        {hasCoords && <Marker position={[latitude, longitude]} icon={pickerIcon} />}
      </MapContainer>
    </div>
  );
}

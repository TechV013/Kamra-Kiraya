"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function DraggableMarker({
  center,
  initialLat,
  initialLng,
  onLocationChange,
}: {
  center: { lat: number; lng: number };
  initialLat: number;
  initialLng: number;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState<L.LatLng>(
    () => L.latLng(initialLat || center.lat, initialLng || center.lng)
  );

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (initialLat && initialLng) {
      const newPos = L.latLng(initialLat, initialLng);
      setPosition(newPos);
      map.setView(newPos, map.getZoom());
    }
  }, [initialLat, initialLng]);

  return (
    <Marker
      draggable={true}
      position={position}
      icon={markerIcon}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition(pos);
          onLocationChange(pos.lat, pos.lng);
        },
      }}
    />
  );
}

function SetViewOnMount({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 10);
  }, []);
  return null;
}

export default function MapPickerInner({
  center,
  initialLat,
  initialLng,
  onLocationChange,
}: {
  center: { lat: number; lng: number };
  initialLat: number;
  initialLng: number;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ height: 300 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SetViewOnMount center={center} />
        <DraggableMarker
          center={center}
          initialLat={initialLat}
          initialLng={initialLng}
          onLocationChange={onLocationChange}
        />
      </MapContainer>
    </div>
  );
}

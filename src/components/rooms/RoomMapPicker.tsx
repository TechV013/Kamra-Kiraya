"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const MapWithPicker = dynamic(
  () => import("@/components/rooms/MapPickerInner"),
  { ssr: false, loading: () => <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" /> }
);

interface RoomMapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function RoomMapPicker({ latitude, longitude, onLocationChange }: RoomMapPickerProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setCurrentLocation({ lat: latitude || 20.5937, lng: longitude || 78.9629 });
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const center = currentLocation || { lat: latitude || 20.5937, lng: longitude || 78.9629 };

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-700 dark:text-gray-300">
        Pin room location on map <span className="text-xs text-gray-400">(drag the marker)</span>
      </label>
      <MapWithPicker
        center={center}
        initialLat={latitude}
        initialLng={longitude}
        onLocationChange={onLocationChange}
      />
      {latitude && longitude && (
        <p className="text-xs text-gray-500">
          Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </p>
      )}
    </div>
  );
}

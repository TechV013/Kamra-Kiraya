"use client";

import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import type { Room } from "@/types";

interface RoomMapProps {
  rooms: Room[];
  selectedRoomId?: string;
  onRoomSelect?: (id: string) => void;
}

export default function RoomMap({ rooms, selectedRoomId, onRoomSelect }: RoomMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [Popup, setPopup] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import("react-leaflet").then((mod) => {
        setMapContainer(() => mod.MapContainer);
        setTileLayer(() => mod.TileLayer);
        setMarker(() => mod.Marker);
        setPopup(() => mod.Popup);
      }),
      import("leaflet/dist/leaflet.css"),
      import("leaflet").then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
      }),
    ]).then(() => setMapReady(true));
  }, []);

  const geoCoded = rooms.filter((r) => r.latitude && r.longitude);

  if (!mapReady || !MapContainer) {
    return (
      <div className="h-full min-h-[400px] rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <MapPin className="w-8 h-8" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  if (geoCoded.length === 0) {
    return (
      <div className="h-full min-h-[400px] rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Navigation className="w-8 h-8" />
          <span className="text-sm">No rooms with location data</span>
        </div>
      </div>
    );
  }

  const center: [number, number] = [geoCoded[0].latitude!, geoCoded[0].longitude!];

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-full min-h-[400px] rounded-2xl z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoCoded.map((room) => (
        <Marker
          key={room.id}
          position={[room.latitude!, room.longitude!]}
          eventHandlers={{
            click: () => onRoomSelect?.(room.id),
          }}
        >
          <Popup>
            <div
              className="cursor-pointer"
              onClick={() => onRoomSelect?.(room.id)}
            >
              <img
                src={room.images?.[0] || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=200&q=60"}
                alt={room.title}
                className="w-full h-24 object-cover rounded-lg mb-1"
              />
              <p className="font-semibold text-sm">{room.title}</p>
              <p className="text-xs text-gray-500">₹{room.priceDaily}/day</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

interface RoomLocationMapProps {
  latitude: number;
  longitude: number;
  title: string;
}

export default function RoomLocationMap({ latitude, longitude, title }: RoomLocationMapProps) {
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [Popup, setPopup] = useState<any>(null);
  const [ready, setReady] = useState(false);

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
    ]).then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <MapPin className="w-6 h-6 text-gray-400 animate-pulse" />
      </div>
    );
  }

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]}>
        <Popup>{title}</Popup>
      </Marker>
    </MapContainer>
  );
}

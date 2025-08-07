
"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Leaflet's default icon path can break in Next.js. This fixes it.
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


interface MapComponentProps {
  markerPosition: [number, number] | null;
  setMarkerPosition: (position: [number, number]) => void;
}

const MapEvents = ({ setMarkerPosition }: { setMarkerPosition: (position: [number, number]) => void }) => {
  useMapEvents({
    click(e) {
      setMarkerPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

const MapComponent = ({ markerPosition, setMarkerPosition }: MapComponentProps) => {

    useEffect(() => {
        // This effect runs on the client side, ensuring window is available
        if (typeof window !== 'undefined') {
          // Additional client-side only initializations can go here
        }
    }, []);

    if (!markerPosition) return null; // Or a loading state

    return (
        <MapContainer 
            center={markerPosition} 
            zoom={13} 
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={markerPosition} />
            <MapEvents setMarkerPosition={setMarkerPosition} />
        </MapContainer>
    );
};

export default MapComponent;

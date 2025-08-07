
"use client";

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet's default icon path can break in Next.js. This fixes it.
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapComponentProps {
  markerPosition: [number, number];
  setMarkerPosition: (position: [number, number]) => void;
}

const MapComponent = ({ markerPosition, setMarkerPosition }: MapComponentProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        // Prevent map re-initialization
        if (mapRef.current) return;

        if (mapContainerRef.current) {
            // Initialize map
            const map = L.map(mapContainerRef.current).setView(markerPosition, 13);
            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Add marker
            const marker = L.marker(markerPosition).addTo(map);
            markerRef.current = marker;

            // Handle map click events
            map.on('click', (e) => {
                const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
                setMarkerPosition(newPos);
            });
        }
        
        // Cleanup function to run when component unmounts
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Effect to update marker position when prop changes
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setLatLng(markerPosition);
        }
        if (mapRef.current) {
            mapRef.current.panTo(markerPosition);
        }
    }, [markerPosition]);


    return (
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
    );
};

export default MapComponent;

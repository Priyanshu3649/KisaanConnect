
"use client";

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Leaflet's default icon path can break in Next.js. This fixes it.
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapComponentProps {
  markerPosition: [number, number];
  setMarkerPosition: (position: [number, number]) => void;
}

const MapComponent = ({ markerPosition, setMarkerPosition }: MapComponentProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    // Map initialization effect
    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return; // Prevent re-initialization

        mapRef.current = L.map(mapContainerRef.current, {
            center: markerPosition,
            zoom: 13,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);

        markerRef.current = L.marker(markerPosition, { draggable: true }).addTo(mapRef.current);

        markerRef.current.on('dragend', (e) => {
            const { lat, lng } = e.target.getLatLng();
            setMarkerPosition([lat, lng]);
        });
        
        // Cleanup function to run when component unmounts
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures this runs only once

    // Effect to update marker position when prop changes from outside (e.g., search)
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setLatLng(markerPosition);
        }
        if (mapRef.current) {
            mapRef.current.panTo(markerPosition);
        }
    }, [markerPosition]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setMarkerPosition([parseFloat(lat), parseFloat(lon)]);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Location not found',
                    description: 'Could not find the specified location. Please try again.',
                });
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            toast({
                variant: 'destructive',
                title: 'Search failed',
                description: 'An error occurred while searching for the location.',
            });
        }
    };

    return (
        <div className="relative h-full w-full">
            <form onSubmit={handleSearch} className="absolute top-2 left-2 z-[1000] w-[calc(100%-1rem)] sm:w-auto sm:max-w-xs flex gap-2 p-2 bg-background/80 backdrop-blur-sm rounded-lg shadow-lg">
                <Input
                    type="text"
                    placeholder="Search for a location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow"
                />
                <Button type="submit" size="icon" variant="default">
                    <Search className="h-4 w-4" />
                </Button>
            </form>
            <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

export default MapComponent;

    
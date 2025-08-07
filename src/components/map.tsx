
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Loader2 } from 'lucide-react';
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
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { toast } = useToast();

    // Map initialization effect
    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return; // Prevent re-initialization

        mapRef.current = L.map(mapContainerRef.current, {
            center: markerPosition,
            zoom: 13,
            zoomControl: false,
        });
        
        L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);

        markerRef.current = L.marker(markerPosition, { draggable: true }).addTo(mapRef.current);

        markerRef.current.on('dragend', (e) => {
            const { lat, lng } = e.target.getLatLng();
            setMarkerPosition([lat, lng]);
            setSearchQuery('');
        });
        
        // Cleanup function to run when component unmounts
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures this runs only once

    // Effect to update marker position when prop changes from outside
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setLatLng(markerPosition);
        }
        if (mapRef.current) {
            mapRef.current.panTo(markerPosition, { animate: true });
        }
    }, [markerPosition]);
    
    // Debounced search effect
    useEffect(() => {
        if (searchQuery.length < 3) {
            setSuggestions([]);
            return;
        }

        const handler = setTimeout(async () => {
            setIsSearching(true);
             try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
                const data = await response.json();
                setSuggestions(data || []);
            } catch (error) {
                console.error('Geocoding error:', error);
                toast({
                    variant: 'destructive',
                    title: 'Search failed',
                    description: 'An error occurred while searching for locations.',
                });
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => {
            clearTimeout(handler);
        };

    }, [searchQuery, toast]);
    
    const handleSuggestionClick = (suggestion: any) => {
        const { lat, lon, display_name } = suggestion;
        setMarkerPosition([parseFloat(lat), parseFloat(lon)]);
        setSearchQuery(display_name);
        setSuggestions([]);
    };

    return (
        <div className="relative h-full w-full">
            <div className="absolute top-2 left-2 z-[1000] w-[calc(100%-1rem)] sm:w-80 flex flex-col gap-2">
                 <div className="flex gap-2 p-2 bg-background/80 backdrop-blur-sm rounded-lg shadow-lg">
                    <Input
                        type="text"
                        placeholder="Search for a location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-grow"
                    />
                     <Button type="submit" size="icon" variant="default" disabled>
                        <Search className="h-4 w-4" />
                    </Button>
                </div>
                { (isSearching || suggestions.length > 0) && (
                     <div className="bg-background/80 backdrop-blur-sm rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {isSearching ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                             <ul className="divide-y divide-border">
                                {suggestions.map((item, index) => (
                                    <li key={index}>
                                        <button 
                                            onClick={() => handleSuggestionClick(item)} 
                                            className="w-full text-left p-3 text-sm hover:bg-muted"
                                        >
                                            {item.display_name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
            <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

export default MapComponent;

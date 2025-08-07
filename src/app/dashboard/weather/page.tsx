
"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Sun, Cloud, CloudSun, CloudRain, CloudFog, CloudSnow, CloudLightning, Thermometer, Droplets, Wind } from "lucide-react";
import { useTranslation } from "@/context/translation-context";
import { getWeather, type GetWeatherOutput } from "@/ai/flows/get-weather";

const WeatherIcon = ({ iconName, ...props }: { iconName: GetWeatherOutput['current']['icon'], [key: string]: any }) => {
    const icons: { [key: string]: React.ElementType } = {
        Sun, Cloud, CloudSun, CloudRain, CloudFog, CloudSnow, CloudLightning
    };
    const Icon = icons[iconName] || Sun;
    return <Icon {...props} />;
};

export default function WeatherPage() {
    const { t } = useTranslation();
    const [weatherData, setWeatherData] = useState<GetWeatherOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [locationStatus, setLocationStatus] = useState("Requesting location permission...");

    useEffect(() => {
        const fetchWeather = () => {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    setLocationStatus("Fetching weather for your location...");
                    const weather = await getWeather({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setWeatherData(weather);
                    setLocationStatus(weather ? "Current weather for your location" : "Could not fetch weather for your location.");
                    setIsLoading(false);
                },
                async (error) => {
                    console.warn(`Geolocation error: ${error.message}. Falling back to default location.`);
                    setLocationStatus("Fetching weather for Delhi (default)...");
                    const weather = await getWeather({ location: "Delhi" });
                    setWeatherData(weather);
                    setLocationStatus(weather ? "Current weather for Delhi" : "Could not fetch weather for Delhi.");
                    setIsLoading(false);
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        };

        fetchWeather();
    }, []);

    return (
        <>
            <PageHeader
                title={t('nav.weather')}
                description={!isLoading ? locationStatus : "Fetching weather data..."}
            />
            {isLoading && (
                <div className="grid gap-6">
                   <Skeleton className="h-48 w-full" />
                   <Skeleton className="h-64 w-full" />
                </div>
            )}
            {!isLoading && weatherData && (
                <div className="grid gap-6">
                    <Card className="bg-primary/10 border-primary/20">
                        <CardHeader>
                            <CardTitle>{t('weather.currentTitle')}</CardTitle>
                            <CardDescription>{t('weather.currentDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <WeatherIcon iconName={weatherData.current.icon} className="h-24 w-24 text-primary" />
                                <div>
                                    <div className="text-6xl font-bold">{weatherData.current.temperature}°C</div>
                                    <div className="text-xl text-muted-foreground">{weatherData.current.condition}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center w-full md:w-auto">
                                <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                                    <Thermometer className="h-6 w-6 mb-2 text-muted-foreground" />
                                    <span className="font-bold">{weatherData.current.high}° / {weatherData.current.low}°</span>
                                    <span className="text-xs text-muted-foreground">{t('weather.highLow')}</span>
                                </div>
                                <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                                    <Droplets className="h-6 w-6 mb-2 text-muted-foreground" />
                                    <span className="font-bold">{weatherData.current.humidity}%</span>
                                    <span className="text-xs text-muted-foreground">{t('weather.humidity')}</span>
                                </div>
                                 <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                                    <Wind className="h-6 w-6 mb-2 text-muted-foreground" />
                                    <span className="font-bold">{weatherData.current.windSpeed} km/h</span>
                                    <span className="text-xs text-muted-foreground">{t('weather.wind')}</span>
                                </div>
                                <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                                    <Cloud className="h-6 w-6 mb-2 text-muted-foreground" />
                                    <span className="font-bold">{weatherData.current.cloudCover}%</span>
                                    <span className="text-xs text-muted-foreground">{t('weather.cloudCover')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('weather.forecastTitle')}</CardTitle>
                            <CardDescription>{t('weather.forecastDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {weatherData.forecast.map((day, index) => (
                                <div key={index} className="flex flex-col items-center p-4 rounded-lg bg-secondary/50">
                                    <p className="font-semibold text-lg">{day.date}</p>
                                    <WeatherIcon iconName={day.icon} className="h-12 w-12 my-3 text-primary" />
                                    <p className="font-bold">{day.high}° / {day.low}°</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}
             {!isLoading && !weatherData && (
                 <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <Loader2 className="h-10 w-10 text-muted-foreground mb-4 animate-spin" />
                    <CardTitle>{t('profile.weatherError')}</CardTitle>
                    <CardDescription>{t('weather.errorDesc')}</CardDescription>
                </Card>
            )}
        </>
    );
}

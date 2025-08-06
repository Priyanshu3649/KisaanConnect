
"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/app-layout";
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
    const [user] = useAuthState(auth);
    const [weatherData, setWeatherData] = useState<GetWeatherOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [location, setLocation] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            if (user) {
                setIsLoading(true);
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setLocation(userData.location);
                        if (userData.location) {
                            const weather = await getWeather({ location: userData.location });
                            setWeatherData(weather);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching weather data: ", error);
                } finally {
                    setIsLoading(false);
                }
            } else if (!user) {
                // Handle case where user is not logged in, maybe redirect or show message
                setIsLoading(false);
            }
        };

        fetchWeather();
    }, [user]);

    return (
        <AppLayout>
            <PageHeader
                title={t('nav.weather')}
                description={location ? t('weather.pageDescription', { location }) : t('weather.pageDescriptionNoLocation')}
            />
            {isLoading && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                   <Skeleton className="h-64 w-full" />
                   <Skeleton className="h-64 w-full" />
                   <Skeleton className="h-64 w-full col-span-1 md:col-span-2 lg:col-span-3" />
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
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <div className="flex flex-col items-center">
                                    <Thermometer className="h-6 w-6 mb-2 text-muted-foreground" />
                                    <span className="font-bold">{weatherData.current.high}° / {weatherData.current.low}°</span>
                                    <span className="text-xs text-muted-foreground">{t('weather.highLow')}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Droplets className="h-6 w-6 mb-2 text-muted-foreground" />
                                    <span className="font-bold">{weatherData.current.humidity}%</span>
                                    <span className="text-xs text-muted-foreground">{t('weather.humidity')}</span>
                                </div>
                                 <div className="flex flex-col items-center">
                                    <Wind className="h-6 w-6 mb-2 text-muted-foreground" />
                                    <span className="font-bold">{weatherData.current.windSpeed} km/h</span>
                                    <span className="text-xs text-muted-foreground">{t('weather.wind')}</span>
                                </div>
                                <div className="flex flex-col items-center">
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
                    <Loader2 className="h-10 w-10 text-muted-foreground mb-4" />
                    <CardTitle>{t('profile.weatherError')}</CardTitle>
                    <CardDescription>{t('weather.errorDesc')}</CardDescription>
                </Card>
            )}
        </AppLayout>
    );
}

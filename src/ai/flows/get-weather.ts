
'use server';

/**
 * @fileOverview A service for fetching real-time weather data using OpenWeatherMap.
 *
 * - getWeather - A function that returns current weather conditions for a given location.
 * - GetWeatherInput - The input type for the getWeather function.
 * - GetWeatherOutput - The return type for the getWeather function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetWeatherInputSchema = z.object({
  location: z.string().describe("The user's location (e.g., 'Pune, Maharashtra')."),
});
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;

const GetWeatherOutputSchema = z.object({
  temperature: z.number().describe('The current temperature in Celsius.'),
  high: z.number().describe('The forecasted high temperature in Celsius.'),
  low: z.number().describe('The forecasted low temperature in Celsius.'),
  condition: z.string().describe('A brief description of the weather conditions (e.g., "Sunny", "Partly cloudy").'),
  cloudCover: z.number().describe('The cloud cover percentage.'),
  icon: z.enum(["Sun", "CloudSun", "Cloud", "CloudRain", "CloudSnow", "CloudFog", "CloudLightning"]).describe("An icon name representing the weather condition."),
});
export type GetWeatherOutput = z.infer<typeof GetWeatherOutputSchema>;

// Mapping from OpenWeatherMap icon codes to our icon set
const weatherCodeToIcon: Record<string, GetWeatherOutput["icon"]> = {
    '01d': 'Sun', '01n': 'Sun',
    '02d': 'CloudSun', '02n': 'CloudSun',
    '03d': 'Cloud', '03n': 'Cloud',
    '04d': 'Cloud', '04n': 'Cloud',
    '09d': 'CloudRain', '09n': 'CloudRain',
    '10d': 'CloudRain', '10n': 'CloudRain',
    '11d': 'CloudLightning', '11n': 'CloudLightning',
    '13d': 'CloudSnow', '13n': 'CloudSnow',
    '50d': 'CloudFog', '50n': 'CloudFog',
};


async function fetchWeatherData(location: string): Promise<GetWeatherOutput | null> {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
        console.error("OpenWeatherMap API key is not configured.");
        return null;
    }

    // 1. Geocode the location to get latitude and longitude using OpenWeatherMap
    const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
    let geocodeResponse;
    try {
        geocodeResponse = await fetch(geocodeUrl);
        if (!geocodeResponse.ok) {
            console.error("Geocoding API request failed:", geocodeResponse.status, await geocodeResponse.text());
            return null;
        }
    } catch (error) {
        console.error("Failed to fetch from Geocoding API:", error);
        return null;
    }
    
    const geocodeData = await geocodeResponse.json();
    if (!geocodeData || geocodeData.length === 0) {
        console.error("No geocoding results found for location:", location);
        return null;
    }
    const { lat, lon } = geocodeData[0];

    // 2. Fetch weather data from OpenWeatherMap using coordinates
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    let weatherResponse;
     try {
        weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) {
            console.error("Weather API request failed:", weatherResponse.status, await weatherResponse.text());
            return null;
        }
    } catch (error) {
        console.error("Failed to fetch from Weather API:", error);
        return null;
    }

    const weatherData = await weatherResponse.json();

    if (!weatherData.main || !weatherData.weather || !weatherData.weather[0]) {
        console.error("Weather data is missing expected fields:", weatherData);
        return null;
    }

    return {
        temperature: Math.round(weatherData.main.temp),
        high: Math.round(weatherData.main.temp_max),
        low: Math.round(weatherData.main.temp_min),
        condition: weatherData.weather[0].main, // e.g., "Clouds", "Rain"
        cloudCover: weatherData.clouds.all, // Cloudiness percentage
        icon: weatherCodeToIcon[weatherData.weather[0].icon] || 'Sun',
    };
}


export async function getWeather(input: GetWeatherInput): Promise<GetWeatherOutput | null> {
  return getWeatherFlow(input);
}


const getWeatherFlow = ai.defineFlow(
  {
    name: 'getWeatherFlow',
    inputSchema: GetWeatherInputSchema,
    outputSchema: z.nullable(GetWeatherOutputSchema),
  },
  async (input) => {
    try {
        if (!input || !input.location) {
            console.error("getWeatherFlow called with no location.");
            return null;
        }
        const data = await fetchWeatherData(input.location);
        return data;
    } catch(error) {
        console.error("Error in getWeatherFlow:", error);
        return null; // Return null on any failure
    }
  }
);

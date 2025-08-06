
'use server';

/**
 * @fileOverview A service for fetching real-time weather data.
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

// This is a simplified mapping. A real implementation might be more complex.
const weatherCodeToIcon: Record<number, GetWeatherOutput["icon"]> = {
    0: 'Sun', // Clear sky
    1: 'CloudSun', // Mainly clear
    2: 'CloudSun', // Partly cloudy
    3: 'Cloud', // Overcast
    45: 'CloudFog', // Fog
    46: 'CloudFog', // Depositing rime fog
    51: 'CloudRain', // Drizzle: Light
    53: 'CloudRain', // Drizzle: Moderate
    55: 'CloudRain', // Drizzle: Dense
    61: 'CloudRain', // Rain: Slight
    63: 'CloudRain', // Rain: Moderate
    65: 'CloudRain', // Rain: Heavy
    80: 'CloudRain', // Rain showers: Slight
    81: 'CloudRain', // Rain showers: Moderate
    82: 'CloudRain', // Rain showers: Violent
    95: 'CloudLightning', // Thundersotrm
};


async function fetchWeatherData(location: string): Promise<GetWeatherOutput | null> {
    // Geocode the location to get latitude and longitude
    const geocodeUrl = `https://geocode.maps.co/search?q=${encodeURIComponent(location)}`;
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

    // Fetch weather data from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,cloud_cover,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
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
    if (!weatherData.current || !weatherData.daily) {
        console.error("Weather data is missing expected fields:", weatherData);
        return null;
    }

    const conditionMap: { [key: number]: string } = {
        0: 'Sunny', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
        61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain', 80: 'Slight Showers', 81: 'Showers',
        82: 'Heavy Showers', 95: 'Thunderstorm'
    };

    return {
        temperature: Math.round(weatherData.current.temperature_2m),
        high: Math.round(weatherData.daily.temperature_2m_max[0]),
        low: Math.round(weatherData.daily.temperature_2m_min[0]),
        condition: conditionMap[weatherData.current.weather_code] || 'Clear',
        cloudCover: weatherData.current.cloud_cover,
        icon: weatherCodeToIcon[weatherData.current.weather_code] || 'Sun',
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
        if (!input.location) {
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

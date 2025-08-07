
'use server';

/**
 * @fileOverview A service for fetching real-time and forecast weather data using OpenWeatherMap.
 *
 * - getWeather - A function that returns current and forecasted weather conditions for a given location.
 * - GetWeatherInput - The input type for the getWeather function.
 * - GetWeatherOutput - The return type for the getWeather function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { format } from 'date-fns';

const GetWeatherInputSchema = z.object({
  location: z.string().optional().describe("The user's location string (e.g., 'Pune, Maharashtra')."),
  latitude: z.number().optional().describe("The user's latitude."),
  longitude: z.number().optional().describe("The user's longitude."),
});
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;

const DailyForecastSchema = z.object({
    date: z.string().describe("The date for the forecast (e.g., 'Monday')."),
    high: z.number().describe('The forecasted high temperature in Celsius.'),
    low: z.number().describe('The forecasted low temperature in Celsius.'),
    icon: z.enum(["Sun", "CloudSun", "Cloud", "CloudRain", "CloudSnow", "CloudFog", "CloudLightning"]).describe("An icon name representing the weather condition."),
});

const GetWeatherOutputSchema = z.object({
  current: z.object({
      temperature: z.number().describe('The current temperature in Celsius.'),
      high: z.number().describe('The forecasted high temperature in Celsius.'),
      low: z.number().describe('The forecasted low temperature in Celsius.'),
      condition: z.string().describe('A brief description of the weather conditions (e.g., "Sunny", "Partly cloudy").'),
      cloudCover: z.number().describe('The cloud cover percentage.'),
      humidity: z.number().describe('The humidity percentage.'),
      windSpeed: z.number().describe('The wind speed in km/h.'),
      icon: z.enum(["Sun", "CloudSun", "Cloud", "CloudRain", "CloudSnow", "CloudFog", "CloudLightning"]).describe("An icon name representing the weather condition."),
  }),
  forecast: z.array(DailyForecastSchema).describe("A 5-day weather forecast."),
});

export type GetWeatherOutput = z.infer<typeof GetWeatherOutputSchema>;

// Mapping from OpenWeatherMap icon codes to our icon set
const weatherCodeToIcon: Record<string, GetWeatherOutput["current"]["icon"]> = {
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


async function fetchWeatherData(input: GetWeatherInput): Promise<GetWeatherOutput | null> {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
        console.error("OpenWeatherMap API key is not configured.");
        return null;
    }

    let lat: number | undefined = input.latitude;
    let lon: number | undefined = input.longitude;

    // 1. Geocode the location to get latitude and longitude if not provided
    if ((!lat || !lon) && input.location) {
        const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(input.location)}&limit=1&appid=${apiKey}`;
        try {
            const geocodeResponse = await fetch(geocodeUrl);
            if (!geocodeResponse.ok) {
                console.error("Geocoding API request failed:", geocodeResponse.status, await geocodeResponse.text());
                return null;
            }
            const geocodeData = await geocodeResponse.json();
            if (geocodeData && geocodeData.length > 0) {
                lat = geocodeData[0].lat;
                lon = geocodeData[0].lon;
            } else {
                 console.error("No geocoding results found for location:", input.location);
                 return null;
            }
        } catch (error) {
            console.error("Failed to fetch from Geocoding API:", error);
            return null;
        }
    }
    
    if (!lat || !lon) {
        console.error("Cannot fetch weather data without coordinates or a valid location.");
        return null;
    }


    // 2. Fetch current weather and forecast data from OpenWeatherMap using coordinates
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(forecastUrl),
        ]);

        if (!weatherResponse.ok) {
            console.error("Weather API request failed:", weatherResponse.status, await weatherResponse.text());
            return null;
        }
        if (!forecastResponse.ok) {
            console.error("Forecast API request failed:", forecastResponse.status, await forecastResponse.text());
            return null;
        }

        const weatherData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();

        if (!weatherData.main || !weatherData.weather || !weatherData.weather[0]) {
            console.error("Weather data is missing expected fields:", weatherData);
            return null;
        }
        
        // Process forecast data to get one entry per day
        const dailyForecasts: { [key: string]: { highs: number[], lows: number[], icons: string[] } } = {};
        forecastData.list.forEach((item: any) => {
            const date = item.dt_txt.split(' ')[0]; // Get just the date part
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = { highs: [], lows: [], icons: [] };
            }
            dailyForecasts[date].highs.push(item.main.temp_max);
            dailyForecasts[date].lows.push(item.main.temp_min);
            dailyForecasts[date].icons.push(item.weather[0].icon);
        });

        const processedForecast = Object.keys(dailyForecasts).slice(0, 5).map(date => {
            const dayData = dailyForecasts[date];
            const high = Math.round(Math.max(...dayData.highs));
            const low = Math.round(Math.min(...dayData.lows));
            // Find the most frequent icon for the day
            const icon = dayData.icons.sort((a,b) => dayData.icons.filter(v => v===a).length - dayData.icons.filter(v => v===b).length).pop()!;
            return {
                date: format(new Date(date), 'EEEE'),
                high,
                low,
                icon: weatherCodeToIcon[icon] || 'Sun',
            };
        });

        return {
            current: {
                temperature: Math.round(weatherData.main.temp),
                high: Math.round(Math.max(...dailyForecasts[new Date().toISOString().split('T')[0]].highs)),
                low: Math.round(Math.min(...dailyForecasts[new Date().toISOString().split('T')[0]].lows)),
                condition: weatherData.weather[0].main,
                cloudCover: weatherData.clouds.all,
                humidity: weatherData.main.humidity,
                windSpeed: Math.round(weatherData.wind.speed * 3.6), // m/s to km/h
                icon: weatherCodeToIcon[weatherData.weather[0].icon] || 'Sun',
            },
            forecast: processedForecast,
        };

    } catch(error) {
        console.error("Failed to fetch from weather/forecast APIs:", error);
        return null;
    }
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
        if (!input || (!input.location && (!input.latitude || !input.longitude))) {
            console.error("getWeatherFlow called with no location or coordinates.");
            return null;
        }
        const data = await fetchWeatherData(input);
        return data;
    } catch(error) {
        console.error("Error in getWeatherFlow:", error);
        return null; // Return null on any failure
    }
  }
);

export const getWeatherTool = ai.defineTool(
    {
        name: 'getWeatherTool',
        description: 'Get the current and forecasted weather for a specific location. Requires either a location string or latitude/longitude.',
        inputSchema: GetWeatherInputSchema,
        outputSchema: z.nullable(GetWeatherOutputSchema),
    },
    async (input) => getWeatherFlow(input)
);

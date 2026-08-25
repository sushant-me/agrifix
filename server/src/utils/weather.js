import axios from 'axios';
import { env } from '../config/env.js';

const WMO_DESCRIPTIONS = {
  0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'fog', 48: 'depositing rime fog',
  51: 'light drizzle', 53: 'moderate drizzle', 55: 'dense drizzle',
  61: 'light rain', 63: 'moderate rain', 65: 'heavy rain',
  71: 'light snow', 73: 'moderate snow', 75: 'heavy snow',
  80: 'light rain showers', 81: 'moderate rain showers', 82: 'violent rain showers',
  95: 'thunderstorm', 96: 'thunderstorm with slight hail', 99: 'thunderstorm with heavy hail',
};

/** Fetch current weather for a city from OpenWeatherMap (metric units). */
export async function fetchOpenWeather(city) {
  const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: { q: city, appid: env.WEATHER_API_KEY, units: 'metric' },
    timeout: 15000,
  });
  if (res.data?.cod !== 200) throw new Error('Weather API returned an error.');
  const d = res.data;
  return {
    city: d.name,
    country: d.sys?.country || '',
    temperature: d.main?.temp ?? null,
    humidity: d.main?.humidity ?? null,
    windSpeed: d.wind?.speed ?? null,
    description: d.weather?.[0]?.description || '',
  };
}

/**
 * Keyless fallback provider (Open-Meteo) - completely free, no API key
 * needed. Used when WEATHER_API_KEY is missing or OpenWeather fails.
 */
async function fetchOpenMeteo(city) {
  const geo = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
    params: { name: city, count: 1, language: 'en', format: 'json' },
    timeout: 15000,
  });
  const place = geo.data?.results?.[0];
  if (!place) throw new Error(`City "${city}" was not found.`);

  const wx = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: place.latitude,
      longitude: place.longitude,
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    },
    timeout: 15000,
  });
  const c = wx.data?.current || {};
  return {
    city: place.name,
    country: place.country || (place.admin1 ? `${place.admin1}, ${place.country || ''}` : '') || 'Nepal',
    temperature: c.temperature_2m ?? null,
    humidity: c.relative_humidity_2m ?? null,
    windSpeed: c.wind_speed_10m ?? null,
    description: WMO_DESCRIPTIONS[c.weather_code] || 'conditions',
  };
}

/** Primary: OpenWeatherMap when a key is configured; otherwise the keyless
 *  Open-Meteo provider. Falls back automatically on any API failure. */
export async function fetchWeatherData(city) {
  if (env.WEATHER_API_KEY) {
    try {
      return await fetchOpenWeather(city);
    } catch (err) {
      console.warn(`[weather] OpenWeatherMap failed (${err.message}); using Open-Meteo.`);
    }
  }
  return fetchOpenMeteo(city);
}
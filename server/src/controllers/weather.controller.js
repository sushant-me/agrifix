import { pool } from '../db/pool.js';
import { ApiError, asyncHandler } from '../middleware/error.js';
import { fetchWeatherData } from '../utils/weather.js';

export const recentWeather = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM weather_data ORDER BY recorded_at DESC LIMIT 10`
  );
  res.json({ success: true, data: rows });
});

export const fetchWeather = asyncHandler(async (req, res) => {
  const city = String(req.query.city || 'Kathmandu').trim();
  if (!city) throw new ApiError(422, 'City is required.');

  let data;
  try {
    data = await fetchWeatherData(city);
  } catch (err) {
    return res.status(502).json({ success: false, message: `Failed to fetch weather: ${err.message}` });
  }

  try {
    await pool.query(
      `INSERT INTO weather_data (city, country, temperature, humidity, wind_speed, weather_description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [data.city, data.country, data.temperature, data.humidity, data.windSpeed, data.description]
    );
  } catch (err) {
    return res.status(500).json({ success: false, message: `Error saving data: ${err.message}` });
  }

  res.json({ success: true, message: 'Weather data saved successfully.', data });
});
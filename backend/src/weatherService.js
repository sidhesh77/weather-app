const axios = require('axios');

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO codes -> short labels
const codeMap = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  95: 'Thunderstorm',
};

function describe(code) {
  return codeMap[code] || 'Unknown';
}

function isValidDate(str) {
  if (!str) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

function parseDateRange(start, end) {
  if (!isValidDate(start) || !isValidDate(end)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.');
  }
  const s = new Date(start);
  const e = new Date(end);
  if (s > e) throw new Error('Start date must be before end date.');
  const diff = (e - s) / (1000 * 60 * 60 * 24);
  if (diff > 16) throw new Error('Date range too long (max 16 days for this API).');
  return { start: start, end: end };
}

async function resolveLocation(input) {
  let trimmed = (input || '').trim();
  if (!trimmed) throw new Error('Location is required.');

  // bare city names that geocoders often get wrong
  const shortcuts = {
    bangalore: 'Bengaluru',
    bengaluru: 'Bengaluru',
    bombay: 'Mumbai',
  };
  const key = trimmed.toLowerCase();
  if (shortcuts[key]) trimmed = shortcuts[key];

  // lat,lon pattern e.g. 12.97,77.59
  const coordMatch = trimmed.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error('Coordinates out of range.');
    }
    return {
      name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      latitude: lat,
      longitude: lon,
      country: '',
    };
  }

  const { data } = await axios.get(GEO_URL, {
    params: { name: trimmed, count: 5, language: 'en', format: 'json' },
    timeout: 10000,
  });

  if (!data.results || data.results.length === 0) {
    throw new Error(`Couldn't find "${trimmed}". Try a city name or zip.`);
  }

  let hit = data.results[0];
  // prefer India when name is ambiguous (e.g. "Springfield")
  const indiaMatch = data.results.find((r) => r.country_code === 'IN');
  if (indiaMatch) hit = indiaMatch;

  return {
    name: [hit.name, hit.admin1, hit.country].filter(Boolean).join(', '),
    latitude: hit.latitude,
    longitude: hit.longitude,
    country: hit.country || '',
  };
}

async function fetchCurrentAndForecast(lat, lon) {
  const { data } = await axios.get(WEATHER_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: 5,
    },
    timeout: 10000,
  });

  const cur = data.current;
  const daily = [];
  for (let i = 0; i < data.daily.time.length; i++) {
    daily.push({
      date: data.daily.time[i],
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      code: data.daily.weather_code[i],
      precipChance: data.daily.precipitation_probability_max[i],
      description: describe(data.daily.weather_code[i]),
    });
  }

  return {
    temperature: cur.temperature_2m,
    feelsLike: cur.apparent_temperature,
    humidity: cur.relative_humidity_2m,
    windSpeed: cur.wind_speed_10m,
    weatherCode: cur.weather_code,
    description: describe(cur.weather_code),
    forecast: daily,
    timezone: data.timezone,
  };
}

async function fetchRangeTemps(lat, lon, dateStart, dateEnd) {
  const { start, end } = parseDateRange(dateStart, dateEnd);

  const { data } = await axios.get(WEATHER_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      timezone: 'auto',
      start_date: start,
      end_date: end,
    },
    timeout: 10000,
  });

  const rows = [];
  for (let i = 0; i < data.daily.time.length; i++) {
    rows.push({
      date: data.daily.time[i],
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      code: data.daily.weather_code[i],
      description: describe(data.daily.weather_code[i]),
    });
  }
  return rows;
}

function youtubeSearchUrl(locationName) {
  const q = encodeURIComponent(`${locationName} travel guide`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

function mapEmbedUrl(lat, lon) {
  // openstreetmap embed - no api key needed
  const delta = 0.08;
  const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
}

module.exports = {
  resolveLocation,
  fetchCurrentAndForecast,
  fetchRangeTemps,
  parseDateRange,
  describe,
  youtubeSearchUrl,
  mapEmbedUrl,
};
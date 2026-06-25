import { useEffect, useState } from 'react';
import SearchBar from './components/SearchBar';
import WeatherCard from './components/WeatherCard';
import ForecastList from './components/ForecastList';
import HistoryPanel from './components/HistoryPanel';
import * as api from './api';

export default function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [mapUrl, setMapUrl] = useState('');
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('backend down');
      setBackendDown(false);
      const list = await api.getRecords();
      setRecords(list);
    } catch (_) {
      setBackendDown(true);
    }
  }

  async function doSearch(query) {
    setError('');
    if (!query || !query.trim()) {
      setError('Enter a city, zip code, landmark, or coordinates (lat,lon).');
      return;
    }

    setLoading(true);
    try {
      const data = await api.lookupWeather(query.trim());
      setWeatherData(data);
      setLastQuery(query.trim());
      if (data.extras?.mapEmbed) setMapUrl(data.extras.mapEmbed);
    } catch (err) {
      setWeatherData(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function useMyLocation() {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation not supported in this browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const data = await api.lookupByCoords(latitude, longitude);
          setWeatherData(data);
          setLastQuery(`${latitude},${longitude}`);
          if (data.extras?.mapEmbed) setMapUrl(data.extras.mapEmbed);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError('Could not get your location. Check permissions.');
      }
    );
  }

  async function saveRecord(payload) {
    setError('');
    try {
      await api.createRecord(payload);
      await loadHistory();
      setError('');
      alert('Saved!');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(id, payload) {
    try {
      await api.updateRecord(id, payload);
      await loadHistory();
      setSelectedId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this record?')) return;
    try {
      await api.deleteRecord(id);
      setSelectedId(null);
      await loadHistory();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Weather App</h1>
      </header>

      <main>
        <SearchBar onSearch={doSearch} onGeo={useMyLocation} loading={loading} />

        {backendDown && (
          <div className="error-box" role="alert">
            Backend is not running. Open a terminal and run:{' '}
            <code>cd backend && npm run dev</code> (port 4000), then refresh this page.
          </div>
        )}

        {error && <div className="error-box" role="alert">{error}</div>}

        <div className="main-grid">
          <div className="left-col">
            <WeatherCard data={weatherData} />
            {weatherData && <ForecastList days={weatherData.weather.forecast} />}
          </div>

          <div className="right-col">
            {mapUrl && (
              <div className="map-wrap">
                <h3>Map</h3>
                <iframe title="location map" src={mapUrl} loading="lazy" />
              </div>
            )}
            <HistoryPanel
              records={records}
              onSave={saveRecord}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onSelect={setSelectedId}
              selectedId={selectedId}
              saveLocation={lastQuery}
            />
          </div>
        </div>
      </main>

      <footer>
        <p>Uses Open-Meteo API (free, no key). Data stored locally in SQLite.</p>
      </footer>
    </div>
  );
}
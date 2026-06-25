import { iconForCode } from '../weatherIcons';

export default function WeatherCard({ data }) {
  if (!data) return null;

  const { location, weather } = data;
  const w = weather;

  return (
    <section className="weather-card">
      <h2>
        {iconForCode(w.weatherCode)} {location.name}
      </h2>
      <p className="big-temp">{Math.round(w.temperature)}°C</p>
      <p className="muted">Feels like {Math.round(w.feelsLike)}°C</p>
      <ul className="detail-list">
        <li><strong>Conditions:</strong> {w.description}</li>
        <li><strong>Humidity:</strong> {w.humidity}%</li>
        <li><strong>Wind:</strong> {w.windSpeed} km/h</li>
        {w.timezone && <li><strong>Timezone:</strong> {w.timezone}</li>}
      </ul>
      {data.extras && (
        <div className="extras-links">
          <a href={data.extras.youtube} target="_blank" rel="noreferrer">YouTube videos</a>
          <a href={data.extras.openStreetMap || data.extras.mapEmbed} target="_blank" rel="noreferrer">View on map</a>
        </div>
      )}
    </section>
  );
}
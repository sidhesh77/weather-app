import { iconForCode } from '../weatherIcons';

export default function ForecastList({ days }) {
  if (!days || days.length === 0) return null;

  return (
    <section className="forecast">
      <h3>5-day forecast</h3>
      <div className="forecast-grid">
        {days.map((d) => (
          <div className="forecast-day" key={d.date}>
            <span className="f-date">{d.date}</span>
            <span className="f-icon">{iconForCode(d.code)}</span>
            <span className="f-desc">{d.description}</span>
            <span className="f-temp">
              {Math.round(d.tempMax)}° / {Math.round(d.tempMin)}°
            </span>
            {d.precipChance != null && (
              <span className="f-rain">Rain {d.precipChance}%</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
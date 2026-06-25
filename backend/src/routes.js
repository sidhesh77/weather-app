const express = require('express');
const db = require('./db');
const ws = require('./weatherService');
const exp = require('./exportService');

const router = express.Router();

// live lookup without saving
router.get('/lookup', async (req, res) => {
  try {
    const q = req.query.q;
    const lat = req.query.lat;
    const lon = req.query.lon;

    let loc;
    if (lat && lon) {
      loc = await ws.resolveLocation(`${lat},${lon}`);
    } else if (q) {
      loc = await ws.resolveLocation(q);
    } else {
      return res.status(400).json({ error: 'Pass ?q=city or ?lat=&lon=' });
    }

    const weather = await ws.fetchCurrentAndForecast(loc.latitude, loc.longitude);
    res.json({
      location: loc,
      weather,
      extras: {
        youtube: ws.youtubeSearchUrl(loc.name),
        mapEmbed: ws.mapEmbedUrl(loc.latitude, loc.longitude),
        openStreetMap: `https://www.openstreetmap.org/?mlat=${loc.latitude}&mlon=${loc.longitude}#map=12/${loc.latitude}/${loc.longitude}`,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CREATE - saves to db
router.post('/records', async (req, res) => {
  try {
    const { location, dateStart, dateEnd, notes } = req.body;
    const loc = await ws.resolveLocation(location);

    let rangeData = null;
    if (dateStart && dateEnd) {
      rangeData = await ws.fetchRangeTemps(loc.latitude, loc.longitude, dateStart, dateEnd);
    }

    const weather = await ws.fetchCurrentAndForecast(loc.latitude, loc.longitude);

    const stmt = db.prepare(`
      INSERT INTO weather_records (
        location_input, location_name, latitude, longitude,
        date_start, date_end, temperature, feels_like, humidity,
        wind_speed, weather_code, description, forecast_json, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const forecastPayload = rangeData || weather.forecast;

    const info = stmt.run(
      location.trim(),
      loc.name,
      loc.latitude,
      loc.longitude,
      dateStart || null,
      dateEnd || null,
      weather.temperature,
      weather.feelsLike,
      weather.humidity,
      weather.windSpeed,
      weather.weatherCode,
      weather.description,
      JSON.stringify(forecastPayload),
      notes || null
    );

    const row = db.prepare('SELECT * FROM weather_records WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(exp.recordToPlain(row));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/records', (req, res) => {
  const rows = db.prepare('SELECT * FROM weather_records ORDER BY id DESC').all();
  res.json(rows.map(exp.recordToPlain));
});

router.get('/records/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM weather_records WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(exp.recordToPlain(row));
});

router.put('/records/:id', async (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM weather_records WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { location, dateStart, dateEnd, notes } = req.body;
    let locName = existing.location_name;
    let lat = existing.latitude;
    let lon = existing.longitude;
    let locInput = existing.location_input;

    // re-fetch weather if location changed
    if (location && location.trim() !== existing.location_input) {
      const loc = await ws.resolveLocation(location);
      locName = loc.name;
      lat = loc.latitude;
      lon = loc.longitude;
      locInput = location.trim();
    }

    if (dateStart && dateEnd) {
      ws.parseDateRange(dateStart, dateEnd); // throws if bad
    }

    const weather = await ws.fetchCurrentAndForecast(lat, lon);
    let forecast = weather.forecast;

    if (dateStart && dateEnd) {
      forecast = await ws.fetchRangeTemps(lat, lon, dateStart, dateEnd);
    }

    db.prepare(`
      UPDATE weather_records SET
        location_input = ?,
        location_name = ?,
        latitude = ?,
        longitude = ?,
        date_start = ?,
        date_end = ?,
        temperature = ?,
        feels_like = ?,
        humidity = ?,
        wind_speed = ?,
        weather_code = ?,
        description = ?,
        forecast_json = ?,
        notes = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      locInput,
      locName,
      lat,
      lon,
      dateStart ?? existing.date_start,
      dateEnd ?? existing.date_end,
      weather.temperature,
      weather.feelsLike,
      weather.humidity,
      weather.windSpeed,
      weather.weatherCode,
      weather.description,
      JSON.stringify(forecast),
      notes !== undefined ? notes : existing.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM weather_records WHERE id = ?').get(req.params.id);
    res.json(exp.recordToPlain(updated));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/records/:id', (req, res) => {
  const info = db.prepare('DELETE FROM weather_records WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

router.get('/records/:id/extras', (req, res) => {
  const row = db.prepare('SELECT * FROM weather_records WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  res.json({
    youtube: ws.youtubeSearchUrl(row.location_name || row.location_input),
    mapEmbed: ws.mapEmbedUrl(row.latitude, row.longitude),
    openStreetMap: `https://www.openstreetmap.org/?mlat=${row.latitude}&mlon=${row.longitude}#map=12/${row.latitude}/${row.longitude}`,
  });
});

router.get('/export', (req, res) => {
  const format = (req.query.format || 'json').toLowerCase();
  const rows = db.prepare('SELECT * FROM weather_records ORDER BY id DESC').all();

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Nothing to export yet' });
  }

  if (format === 'json') {
    res.setHeader('Content-Disposition', 'attachment; filename=weather-export.json');
    res.type('json').send(exp.toJson(rows));
  } else if (format === 'csv') {
    res.setHeader('Content-Disposition', 'attachment; filename=weather-export.csv');
    res.type('text/csv').send(exp.toCsv(rows));
  } else if (format === 'xml') {
    res.setHeader('Content-Disposition', 'attachment; filename=weather-export.xml');
    res.type('application/xml').send(exp.toXml(rows));
  } else if (format === 'md' || format === 'markdown') {
    res.setHeader('Content-Disposition', 'attachment; filename=weather-export.md');
    res.type('text/markdown').send(exp.toMarkdown(rows));
  } else if (format === 'pdf') {
    exp.toPdf(rows, res);
  } else {
    res.status(400).json({ error: 'format must be json, csv, xml, md, or pdf' });
  }
});

module.exports = router;
const PDFDocument = require('pdfkit');

function recordToPlain(rec) {
  let forecast = [];
  try {
    forecast = JSON.parse(rec.forecast_json || '[]');
  } catch (_) {}

  return {
    id: rec.id,
    locationInput: rec.location_input,
    locationName: rec.location_name,
    latitude: rec.latitude,
    longitude: rec.longitude,
    dateStart: rec.date_start,
    dateEnd: rec.date_end,
    temperature: rec.temperature,
    feelsLike: rec.feels_like,
    humidity: rec.humidity,
    windSpeed: rec.wind_speed,
    description: rec.description,
    weatherCode: rec.weather_code,
    notes: rec.notes,
    forecast,
    createdAt: rec.created_at,
    updatedAt: rec.updated_at,
  };
}

function toJson(records) {
  return JSON.stringify(records.map(recordToPlain), null, 2);
}

function toCsv(records) {
  const header = [
    'id', 'location_input', 'location_name', 'latitude', 'longitude',
    'date_start', 'date_end', 'temperature', 'feels_like', 'humidity',
    'wind_speed', 'description', 'notes', 'created_at'
  ];
  const lines = [header.join(',')];

  for (const r of records) {
    const row = [
      r.id,
      csvEscape(r.location_input),
      csvEscape(r.location_name),
      r.latitude,
      r.longitude,
      r.date_start || '',
      r.date_end || '',
      r.temperature,
      r.feels_like,
      r.humidity,
      r.wind_speed,
      csvEscape(r.description),
      csvEscape(r.notes || ''),
      r.created_at,
    ];
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

function csvEscape(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toXml(records) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<weatherRecords>\n';
  for (const r of records) {
    xml += '  <record>\n';
    xml += `    <id>${r.id}</id>\n`;
    xml += `    <locationInput>${escXml(r.location_input)}</locationInput>\n`;
    xml += `    <locationName>${escXml(r.location_name)}</locationName>\n`;
    xml += `    <latitude>${r.latitude}</latitude>\n`;
    xml += `    <longitude>${r.longitude}</longitude>\n`;
    xml += `    <temperature>${r.temperature}</temperature>\n`;
    xml += `    <description>${escXml(r.description)}</description>\n`;
    xml += `    <createdAt>${r.created_at}</createdAt>\n`;
    xml += '  </record>\n';
  }
  xml += '</weatherRecords>';
  return xml;
}

function escXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toMarkdown(records) {
  let md = '# Weather Export\n\n';
  for (const r of records) {
    md += `## ${r.location_name || r.location_input}\n`;
    md += `- **ID:** ${r.id}\n`;
    md += `- **Temp:** ${r.temperature}°C (feels ${r.feels_like}°C)\n`;
    md += `- **Conditions:** ${r.description}\n`;
    md += `- **Humidity:** ${r.humidity}%\n`;
    md += `- **Wind:** ${r.wind_speed} km/h\n`;
    if (r.date_start) md += `- **Range:** ${r.date_start} → ${r.date_end}\n`;
    if (r.notes) md += `- **Notes:** ${r.notes}\n`;
    md += `- **Saved:** ${r.created_at}\n\n`;
  }
  return md;
}

function toPdf(records, res) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=weather-export.pdf');
  doc.pipe(res);

  doc.fontSize(18).text('Weather Data Export', { underline: true });
  doc.moveDown();

  records.forEach((r, idx) => {
    if (idx > 0) doc.moveDown();
    doc.fontSize(12).text(`${r.location_name || r.location_input}`, { continued: false });
    doc.fontSize(10);
    doc.text(`ID: ${r.id}`);
    doc.text(`Temp: ${r.temperature}°C  |  Feels: ${r.feels_like}°C`);
    doc.text(`${r.description}  |  Humidity: ${r.humidity}%  |  Wind: ${r.wind_speed} km/h`);
    if (r.date_start) doc.text(`Date range: ${r.date_start} to ${r.date_end}`);
    if (r.notes) doc.text(`Notes: ${r.notes}`);
    doc.text(`Saved: ${r.created_at}`);
  });

  doc.end();
}

module.exports = {
  recordToPlain,
  toJson,
  toCsv,
  toXml,
  toMarkdown,
  toPdf,
};
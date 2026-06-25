import { useState } from 'react';
import { iconForCode } from '../weatherIcons';

export default function HistoryPanel({
  records,
  onSave,
  onUpdate,
  onDelete,
  onSelect,
  selectedId,
  saveLocation,
}) {
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const selected = records.find((r) => r.id === selectedId);

  return (
    <section className="history-panel">
      <h3>Saved searches (database)</h3>

      <div className="save-form">
        <p className="hint">Save current location to DB with optional date range</p>
        <div className="row">
          <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          <span>to</span>
          <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
        </div>
        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="button"
          disabled={!saveLocation}
          onClick={() => {
            onSave({ location: saveLocation, dateStart, dateEnd, notes });
            setNotes('');
          }}
        >
          Save to database
        </button>
      </div>

      <div className="export-row">
        <span>Export all:</span>
        {['json', 'csv', 'xml', 'md', 'pdf'].map((f) => (
          <a key={f} href={`/api/export?format=${f}`} target="_blank" rel="noreferrer">
            {f.toUpperCase()}
          </a>
        ))}
      </div>

      {records.length === 0 ? (
        <p className="muted">No saved records yet.</p>
      ) : (
        <ul className="record-list">
          {records.map((r) => (
            <li
              key={r.id}
              className={r.id === selectedId ? 'active' : ''}
              onClick={() => onSelect(r.id)}
            >
              <span>{iconForCode(r.weatherCode)} {r.locationName}</span>
              <span>{Math.round(r.temperature)}°C — {r.description}</span>
              {r.dateStart && (
                <span className="small">{r.dateStart} → {r.dateEnd}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="edit-box">
          <h4>Edit record #{selected.id}</h4>
          <input
            type="text"
            defaultValue={selected.locationInput}
            id="edit-location"
          />
          <input
            type="text"
            placeholder="Notes"
            value={editNotes || selected.notes || ''}
            onChange={(e) => setEditNotes(e.target.value)}
          />
          <div className="btn-row">
            <button
              type="button"
              onClick={() => {
                const loc = document.getElementById('edit-location').value;
                onUpdate(selected.id, {
                  location: loc,
                  notes: editNotes,
                });
              }}
            >
              Update
            </button>
            <button type="button" className="btn-danger" onClick={() => onDelete(selected.id)}>
              Delete
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
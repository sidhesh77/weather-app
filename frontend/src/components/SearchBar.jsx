export default function SearchBar({ onSearch, onGeo, loading }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="City, zip, landmark, or lat,lon"
        id="location-input"
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch(e.target.value);
        }}
      />
      <button type="button" disabled={loading} onClick={() => {
        const el = document.getElementById('location-input');
        onSearch(el.value);
      }}>
        {loading ? 'Loading...' : 'Search'}
      </button>
      <button type="button" className="btn-secondary" disabled={loading} onClick={onGeo}>
        Use my location
      </button>
    </div>
  );
}
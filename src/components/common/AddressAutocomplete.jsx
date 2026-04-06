import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
//import { useLanguage } from '../LanguageContext';


export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, className = '', userCity = '' }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  //const { t } = useLanguage();

  const resolvedPlaceholder = placeholder ?? ''/*t.searchAddress*/;
  // Sync external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = async (q) => {
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      // Build query biased toward user's city if available
      const city = userCity || localStorage.getItem('selectedCity') || '';
      const biasedQuery = city && !q.toLowerCase().includes(city.toLowerCase())
        ? `${q}, ${city}`
        : q;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(biasedQuery)}&format=json&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();

      // If biased query returned results, use them; otherwise fallback to plain query
      if (data.length > 0) {
        setResults(data);
        setOpen(true);
      } else if (city) {
        // Fallback: search without city bias
        const fallbackRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const fallbackData = await fallbackRes.json();
        setResults(fallbackData);
        setOpen(fallbackData.length > 0);
      } else {
        setResults([]);
        setOpen(false);
      }
    } catch (_) {}
    setLoading(false);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange?.(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (item) => {
    const addr = item.display_name;
    const city =
      item.address?.city ||
      item.address?.town ||
      item.address?.village ||
      item.address?.county ||
      item.address?.state ||
      '';
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    // Build a clean short address (street + number)
    const street = item.address?.road || item.address?.pedestrian || item.address?.neighbourhood || '';
    const number = item.address?.house_number || '';
    const shortAddr = street ? (number ? `${street} ${number}` : street) : addr.split(',')[0];

    setQuery(shortAddr);
    setOpen(false);
    onSelect?.({ address: shortAddr, city, latitude: lat, longitude: lon, full: addr });
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={resolvedPlaceholder}
          className="w-full pl-9 pr-10 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00c6d2] transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00c6d2] animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl"
          >
            {results.map((item) => (
              <li key={item.place_id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(item)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-800 transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-[#00c6d2] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white text-sm leading-tight truncate">
                      {item.display_name.split(',').slice(0, 2).join(',')}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">
                      {item.display_name.split(',').slice(2).join(',').trim()}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
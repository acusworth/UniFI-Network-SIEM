import React, { useState, useEffect } from 'react';
import StreamFilters from './StreamFilters';
import EventRow from './EventRow';
import EventDetail from './EventDetail';
import { EVENT_TYPES } from '../../lib/constants';
import { getEvents } from '../../lib/api';

export default function Search() {
  const [events, setEvents] = useState([]);
  const [activeTypes, setActiveTypes] = useState(new Set(Object.keys(EVENT_TYPES)));
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleToggleType = (type) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  useEffect(() => {
    if (activeTypes.size === 0) {
      setEvents([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    const timeout = setTimeout(async () => {
      try {
        const types = Array.from(activeTypes);
        const params = {
          search: search.trim(),
          ...(types.length < Object.keys(EVENT_TYPES).length
            ? { event_type: types.join(',') }
            : {}),
        };
        const result = await getEvents(params);
        if (!cancelled) {
          setEvents(Array.isArray(result) ? result : result.events || []);
        }
      } catch (err) {
        if (!cancelled) {
          setEvents([]);
          setError(err.message || 'Failed to search events');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [activeTypes, search]);

  return (
    <div className="flex flex-col h-full">
      <StreamFilters
        activeTypes={activeTypes}
        onToggleType={handleToggleType}
        search={search}
        onSearchChange={setSearch}
        showStreamControls={false}
      />

      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 border-b border-gray-800 text-xs text-gray-500">
        <span className="ml-auto">{events.length} events</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-gray-900 z-10">
            <tr className="border-b border-gray-700">
              <th className="px-3 py-2 text-xs font-medium text-gray-400">Time</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-400">Type</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-400">Action</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-400">Source</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-400">Dest</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-400">Port</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-400">Proto</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-400">Message</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-400">Host</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => (
              <EventRow
                key={event.id || `event-${i}`}
                event={event}
                onClick={setSelectedEvent}
              />
            ))}
          </tbody>
        </table>

        {events.length === 0 && (
          <div className="flex items-center justify-center h-48 text-gray-600">
            {loading ? 'Searching events...' : error || 'No events found.'}
          </div>
        )}
      </div>

      <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

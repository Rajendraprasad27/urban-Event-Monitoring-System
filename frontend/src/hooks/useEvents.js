import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, eventService } from '../services/api';

export function useEvents(filters = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveStatus, setLiveStatus] = useState('connecting');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventService.list(filters);
      setEvents(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load events');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const wsUrl = `${API_BASE_URL.replace('https', 'wss').replace('http', 'ws')}/ws/events`;
    const socket = new WebSocket(wsUrl);
    socket.onopen = () => setLiveStatus('connected');
    socket.onerror = () => setLiveStatus('offline');
    socket.onclose = () => setLiveStatus('offline');
    socket.onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);
        if (payload.type === 'event.created') {
          setEvents((current) => [payload.event, ...current].slice(0, 80));
        }
      } catch {
        setLiveStatus('connected');
      }
    };
    return () => socket.close();
  }, []);

  const metrics = useMemo(() => ({
    total: events.length,
    high: events.filter((event) => event.severity === 'high').length,
    avgConfidence: Math.round(events.reduce((sum, event) => sum + (event.confidence || 0), 0) / Math.max(events.length, 1) * 100),
  }), [events]);

  return { events, loading, error, liveStatus, metrics, reload: load, setEvents };
}

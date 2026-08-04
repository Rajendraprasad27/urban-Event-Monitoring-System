import { useMemo, useState, useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Send, MapPin, X, Loader2, Navigation, RadioTower, Flame, HelpCircle, Sparkles, TrendingUp } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import EventCard from '../components/EventCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { eventService, analyticsService } from '../services/api';
import { useEvents } from '../hooks/useEvents';

const NEIGHBORHOODS = [
  { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
  { name: 'Koramangala', lat: 12.9279, lng: 77.6271 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7499 },
  { name: 'Jayanagar', lat: 12.9308, lng: 77.5838 },
  { name: 'HSR Layout', lat: 12.9101, lng: 77.6450 },
  { name: 'MG Road', lat: 12.9740, lng: 77.6077 }
];

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

const getCategoryMarkerIcon = (category) => {
  let emoji = 'ℹ️';
  let colorClass = 'bg-slate-800 border-slate-600 text-slate-100 shadow-slate-500/35';

  const cat = category?.toLowerCase() || '';
  if (cat.includes('accident')) {
    emoji = '💥';
    colorClass = 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-rose-500/35';
  } else if (cat.includes('fire')) {
    emoji = '🔥';
    colorClass = 'bg-orange-950/80 border-orange-500 text-orange-300 shadow-orange-500/35';
  } else if (cat.includes('flood') || cat.includes('water') || cat.includes('weather')) {
    emoji = '💧';
    colorClass = 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-cyan-500/35';
  } else if (cat.includes('traffic')) {
    emoji = '⚠️';
    colorClass = 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-amber-500/35';
  } else if (cat.includes('gathering') || cat.includes('people') || cat.includes('protest')) {
    emoji = '👥';
    colorClass = 'bg-violet-950/80 border-violet-500 text-violet-300 shadow-violet-500/35';
  } else if (cat.includes('emergency')) {
    emoji = '🚨';
    colorClass = 'bg-red-950/80 border-red-500 text-red-300 shadow-red-600/35';
  }

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${colorClass} text-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:scale-115 transition-transform duration-200 cursor-pointer">
        <span class="relative z-10">${emoji}</span>
        <div class="absolute inset-0 rounded-full animate-pulse opacity-25 ${colorClass.split(' ')[0]}"></div>
      </div>
    `,
    className: 'custom-live-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};


export default function LiveMonitoring() {
  const [text, setText] = useState('Heavy traffic and accident reported near Koramangala at 8 pm, ambulance on the way.');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Neighborhood Pulse / Local Feed States
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'local'
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [detectingUserGps, setDetectingUserGps] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Indiranagar');
  const [detectedNeighborhood, setDetectedNeighborhood] = useState(null);

  // Trends section states
  const [trends, setTrends] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

  const { events, loading, reload } = useEvents();
  const markers = useMemo(() => events.filter((event) => event.latitude && event.longitude), [events]);

  const mapCenter = useMemo(() => {
    if (activeTab === 'local') {
      const n = NEIGHBORHOODS.find((nb) => nb.name === selectedNeighborhood);
      if (n) return [n.lat, n.lng];
    }
    if (userLat && userLng) return [userLat, userLng];
    return [12.9716, 77.5946];
  }, [activeTab, selectedNeighborhood, userLat, userLng]);

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setFetchingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setFetchingGps(false);
      },
      (error) => {
        let msg = 'Failed to get location';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'GPS permission denied';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'GPS location unavailable';
        } else if (error.code === error.TIMEOUT) {
          msg = 'GPS fetch timed out';
        }
        setGpsError(msg);
        setFetchingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDetectUserLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingUserGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const uLat = position.coords.latitude;
        const uLng = position.coords.longitude;
        setUserLat(uLat);
        setUserLng(uLng);
        setDetectingUserGps(false);

        // Find the closest neighborhood
        let closest = NEIGHBORHOODS[0];
        let minDistance = Infinity;

        NEIGHBORHOODS.forEach((n) => {
          const dist = getDistance(uLat, uLng, n.lat, n.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closest = n;
          }
        });

        setSelectedNeighborhood(closest.name);
        setDetectedNeighborhood(closest.name);
      },
      () => {
        setDetectingUserGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearGps = () => {
    setLatitude(null);
    setLongitude(null);
    setGpsError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    await eventService.process({
      text,
      source: 'manual',
      latitude: latitude !== null ? parseFloat(latitude) : undefined,
      longitude: longitude !== null ? parseFloat(longitude) : undefined,
    });
    setText('');
    setLatitude(null);
    setLongitude(null);
    await reload();
  };

  // Filter events based on active tab and selected neighborhood
  const filteredEvents = useMemo(() => {
    if (activeTab === 'all') return events;

    const targetN = NEIGHBORHOODS.find((n) => n.name === selectedNeighborhood);
    if (!targetN) return [];

    return events.filter((event) => {
      // 1. Check textual match in event locations
      const textMatch = event.locations?.some((loc) =>
        loc.toLowerCase().includes(selectedNeighborhood.toLowerCase())
      );
      if (textMatch) return true;

      // 2. Check spatial distance match (within 3.5 km)
      if (event.latitude && event.longitude) {
        const dist = getDistance(event.latitude, event.longitude, targetN.lat, targetN.lng);
        if (dist <= 3.5) return true;
      }

      return false;
    });
  }, [events, activeTab, selectedNeighborhood]);

  // Load trends
  useEffect(() => {
    setLoadingTrends(true);
    analyticsService.trending()
      .then((res) => {
        setTrends(res.trends || []);
      })
      .catch((err) => {
        console.error("Trends load failed", err);
      })
      .finally(() => {
        setLoadingTrends(false);
      });
  }, [events]);

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Top Section: Ingestion form and Leaflet Map */}
      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <form onSubmit={submit} className="glass-panel p-5">
            <h2 className="text-2xl font-black text-cyber-heading">Live Monitoring</h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-4 min-h-36 w-full rounded-md border border-cyber-border bg-cyber-panel p-3 text-sm text-slate-100 outline-none focus:border-cyber-accent"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGetGps}
                  disabled={fetchingGps}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    fetchingGps
                      ? 'bg-cyber-border text-cyber-text'
                      : 'bg-cyber-border/40 hover:bg-cyber-border border border-cyber-border text-cyber-text hover:text-cyber-heading'
                  }`}
                >
                  {fetchingGps ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-cyber-accent" />
                      Locating...
                    </>
                  ) : (
                    <>
                      <MapPin size={13} className="text-cyber-accent" />
                      Use Current GPS
                    </>
                  )}
                </button>

                {gpsError && (
                  <span className="text-[11px] font-medium text-rose-400 bg-rose-950/20 border border-rose-950/40 rounded px-2 py-0.5 animate-pulse">
                    {gpsError}
                  </span>
                )}
              </div>

              {latitude !== null && longitude !== null && (
                <div className="inline-flex items-center gap-2 rounded-md border border-cyber-neon/30 bg-cyber-neon/10 px-2 py-1 text-xs text-cyber-neon font-medium animate-fade-in">
                  <Navigation size={11} className="animate-pulse" />
                  <span>GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                  <button
                    type="button"
                    onClick={clearGps}
                    className="rounded-full p-0.5 hover:bg-cyber-neon/20 transition-colors cursor-pointer"
                    title="Clear GPS"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>

            <button className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md bg-cyber-accent hover:bg-cyber-accent/90 px-4 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer">
              <Send size={16} /> Process report
            </button>
          </form>

          {/* Tab Selector */}
          <div className="flex border-b border-cyber-border pb-1 mt-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-[0.14em] transition-all cursor-pointer text-center ${
                activeTab === 'all'
                  ? 'border-b-2 border-cyber-accent text-cyber-heading'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => {
                setActiveTab('local');
                if (userLat === null) {
                  handleDetectUserLocation();
                }
              }}
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-[0.14em] transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'local'
                  ? 'border-b-2 border-cyber-accent text-cyber-heading'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Navigation size={12} className={activeTab === 'local' ? "text-cyber-accent animate-pulse" : ""} />
              Local Feed
            </button>
          </div>

          {/* Neighborhood selector and detected state */}
          {activeTab === 'local' && (
            <div className="glass-panel p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyber-text/70">
                  Neighborhood Pulse
                </span>
                <button
                  type="button"
                  onClick={handleDetectUserLocation}
                  className="text-[10px] font-bold text-cyber-neon hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {detectingUserGps ? (
                    <>
                      <Loader2 size={10} className="animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <Navigation size={10} />
                      {detectedNeighborhood ? 'GPS Locked' : 'Detect GPS'}
                    </>
                  )}
                </button>
              </div>

              {/* Neighborhood Pills */}
              <div className="flex flex-wrap gap-1.5">
                {NEIGHBORHOODS.map((n) => {
                  const isSelected = selectedNeighborhood === n.name;
                  const isDetected = detectedNeighborhood === n.name;
                  return (
                    <button
                      key={n.name}
                      type="button"
                      onClick={() => setSelectedNeighborhood(n.name)}
                      className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full transition-all border flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-cyber-accent bg-cyber-accent/15 text-cyber-heading'
                          : 'border-cyber-border bg-cyber-border/20 text-cyber-text hover:text-cyber-heading hover:border-cyber-border/80'
                      }`}
                    >
                      {isDetected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-neon animate-pulse" />
                      )}
                      {n.name}
                    </button>
                  );
                })}
              </div>

              {detectedNeighborhood && (
                <p className="text-[10px] text-cyber-text/60 italic">
                  Nearest neighborhood detected via GPS: <strong className="text-cyber-neon">{detectedNeighborhood}</strong>
                </p>
              )}
            </div>
          )}

          {loading ? (
            <LoadingSkeleton />
          ) : filteredEvents.length > 0 ? (
            filteredEvents.slice(0, 6).map((event) => (
              <EventCard key={event.id || event.raw_text} event={event} />
            ))
          ) : (
            <div className="glass-panel p-8 text-center border-dashed border-cyber-border">
              <RadioTower className="mx-auto mb-3 text-slate-500 animate-pulse" size={24} />
              <p className="text-sm font-bold text-slate-300">No active signals in {selectedNeighborhood}.</p>
              <p className="text-xs text-slate-500 mt-1">Submit a report or select another neighborhood to monitor.</p>
            </div>
          )}
        </div>
        <div className="glass-panel min-h-[620px] overflow-hidden">
          <MapContainer center={mapCenter} zoom={12} className="h-full min-h-[620px] w-full" zoomControl={false}>
            <ChangeMapView center={mapCenter} />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="OSM, CARTO" />
            {markers.map((event) => (
              <Marker 
                key={event.id || event.raw_text} 
                position={[event.latitude, event.longitude]}
                icon={getCategoryMarkerIcon(event.category)}
              >
                <Popup>
                  <div className="p-1 space-y-1">
                    <span className="rounded border border-cyber-accent/40 bg-cyber-accent/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyber-accent">
                      {event.category}
                    </span>
                    <strong className="block text-xs text-cyber-heading mt-1">{event.locations?.join(', ') || 'Bengaluru'}</strong>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">{event.summary}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>

      {/* Bottom Section: Citywide Trending Panel */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-cyber-border pb-3">
          <TrendingUp className="text-cyber-accent animate-pulse" size={20} />
          <h3 className="text-lg font-black uppercase tracking-wider text-cyber-heading">
            Citywide Trending & Discussion Pulse
          </h3>
        </div>

        {loadingTrends ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-xs">
            <Loader2 size={24} className="animate-spin text-cyber-accent" />
            <span className="text-slate-400">Loading discussion matrices...</span>
          </div>
        ) : trends.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trends.slice(0, 6).map((trend, idx) => {
              const score = trend.size * 12 + 40; // trending score calculation
              return (
                <div 
                  key={trend.id}
                  className="border border-cyber-border bg-cyber-dark/40 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-cyber-accent/40 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md border border-cyber-neon/30 bg-cyber-neon/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyber-neon">
                        {trend.category}
                      </span>
                      <span className="text-[10px] text-cyber-accent font-mono font-bold">
                        Score: {score} pts
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-cyber-heading flex items-center gap-1">
                      <MapPin size={11} className="text-slate-500" />
                      {trend.location}
                    </h4>

                    {/* AI description structured detail */}
                    <p className="text-xs text-slate-300 leading-relaxed font-medium line-clamp-3">
                      {trend.raw_summary}
                    </p>
                  </div>

                  <div className="border-t border-cyber-border/40 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>🔥 Trend Rank #{idx + 1}</span>
                    <span>{trend.size} related post{trend.size > 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            No active citywide discussion patterns identified.
          </div>
        )}
      </section>
    </div>
  );
}

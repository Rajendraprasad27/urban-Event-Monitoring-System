import { useMemo, useState, useEffect, useRef } from 'react';
import { Send, MapPin, X, Loader2, Navigation, RadioTower, Sparkles, AlertTriangle, Image as ImageIcon, Flame, Phone, CheckCircle2 } from 'lucide-react';
import EventCard from '../components/EventCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { eventService, API_BASE_URL } from '../services/api';
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

// Help extract street name from event text
const extractStreetName = (text) => {
  const regex = /\b(?:\d+(?:st|nd|rd|th)?\s+)?(?:[A-Za-z0-9]+\s+)+(?:Road|Street|St|Avenue|Lane|Main|Cross|Layout|Block|Junction|Flyover)\b/i;
  const match = text.match(regex);
  return match ? match[0] : "Main Roadway";
};

// Help extract emergency intensity description
const getIntensity = (event) => {
  const text = (event.raw_text || "").toLowerCase();
  if (text.includes("massive") || text.includes("severe") || text.includes("critical") || text.includes("huge") || event.severity === "high") {
    return "High Intensity / Major Alert";
  }
  if (text.includes("moderate") || text.includes("medium") || event.severity === "medium") {
    return "Medium Intensity / Active Response";
  }
  return "Low Intensity / Monitoring";
};

export default function Home() {
  const [text, setText] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Emergency submission states
  const [isEmergencyReport, setIsEmergencyReport] = useState(false);
  const [emergencyText, setEmergencyText] = useState('');
  const [emergencyCategory, setEmergencyCategory] = useState('Fire');
  const [mediaUrl, setMediaUrl] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-location tracking states
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Indiranagar');
  const [detectedNeighborhood, setDetectedNeighborhood] = useState(null);

  // Event list
  const { events, loading, reload } = useEvents();

  // Dialog modals
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const [activeHazardAlert, setActiveHazardAlert] = useState(null);

  // Watch position automatically on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setTrackingActive(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);

        // Auto set current lat/lng variables as well
        setLatitude(lat);
        setLongitude(lng);

        // Find the closest neighborhood automatically
        let closest = NEIGHBORHOODS[0];
        let minDistance = Infinity;

        NEIGHBORHOODS.forEach((n) => {
          const dist = getDistance(lat, lng, n.lat, n.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closest = n;
          }
        });

        setSelectedNeighborhood(closest.name);
        setDetectedNeighborhood(closest.name);
      },
      (error) => {
        console.error("GPS Watch failed", error);
        setTrackingActive(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported.');
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
        setGpsError('Failed to get GPS fix');
        setFetchingGps(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/events/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.url) {
        setMediaUrl(data.url);
      }
    } catch (err) {
      console.error("File upload failed", err);
    } finally {
      setUploadingFile(false);
    }
  };

  const clearGps = () => {
    setLatitude(null);
    setLongitude(null);
    setGpsError(null);
  };

  const clearMedia = () => {
    setMediaUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const payloadText = isEmergencyReport ? `[EMERGENCY - ${emergencyCategory}] ${emergencyText}` : text;
    if (!payloadText.trim()) return;

    await eventService.process({
      text: payloadText,
      source: isEmergencyReport ? 'emergency' : 'manual',
      latitude: latitude !== null ? parseFloat(latitude) : undefined,
      longitude: longitude !== null ? parseFloat(longitude) : undefined,
      media_url: mediaUrl || undefined
    });

    setText('');
    setEmergencyText('');
    setMediaUrl(null);
    setLatitude(userLat);
    setLongitude(userLng);
    setIsEmergencyReport(false);
    await reload();
  };

  // Filter events based on active selected neighborhood
  const filteredEvents = useMemo(() => {
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
  }, [events, selectedNeighborhood]);

  // Proximity Alert Detection: Identify immediate hazards within 3 km of user location
  const localEmergencyHazards = useMemo(() => {
    if (userLat === null || userLng === null) return [];

    return events.filter((event) => {
      const isEmergencyType = event.category === 'Emergency' || event.category === 'Flood' || event.severity === 'high';
      const text = (event.raw_text || "").toLowerCase();
      const hasEmergencyKeywords = text.includes('fire') || text.includes('flood') || text.includes('bee') || text.includes('wasp') || text.includes('attack') || text.includes('leak') || text.includes('collapse') || text.includes('explosion');
      
      if (!isEmergencyType && !hasEmergencyKeywords) return false;
      if (!event.latitude || !event.longitude) return false;

      const dist = getDistance(userLat, userLng, event.latitude, event.longitude);
      return dist <= 3.0; // within 3.0 km of current coordinates
    });
  }, [events, userLat, userLng]);

  // Click handler to open summary modal
  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    setSummarizing(true);
    setSummaryData(null);
    try {
      const res = await eventService.summarize([event.raw_text]);
      const locName = event.locations && event.locations.length > 0 
        ? event.locations[0] 
        : selectedNeighborhood;
        
      setSummaryData({
        location: locName,
        category: event.category,
        summary: res.summary || event.summary || "No summary returned.",
        street: extractStreetName(event.raw_text),
        intensity: getIntensity(event),
        media: event.media_url ? `${API_BASE_URL}${event.media_url}` : null
      });
    } catch (err) {
      console.error(err);
      setSummaryData({
        location: selectedNeighborhood,
        category: event.category,
        summary: event.summary || "Failed to compile AI summary fallback.",
        street: extractStreetName(event.raw_text),
        intensity: getIntensity(event),
        media: event.media_url ? `${API_BASE_URL}${event.media_url}` : null
      });
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
      
      {/* Active Hazards Alert Area */}
      {localEmergencyHazards.length > 0 && (
        <div className="border border-red-500/50 bg-red-950/20 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-500 flex-shrink-0 animate-ping">
              <Flame size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-red-400">⚠️ Immediate Local Hazard Alert</h4>
              <p className="text-xs text-red-200 mt-0.5 leading-relaxed">
                An active incident is reported near your position. Protect yourself and monitor telemetry.
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleEventClick(localEmergencyHazards[0])}
            className="w-full md:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white rounded-md transition-colors cursor-pointer text-center"
          >
            Review Hazard Profile
          </button>
        </div>
      )}

      {/* Main Dashboard Portal Container */}
      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        
        {/* Left Side: Twitter-like Ingestion Feed */}
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyber-neon">Operational Console</p>
              <h2 className="mt-1 text-2xl font-black text-cyber-heading">CityMind Live Feed</h2>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-cyber-neon/20 bg-cyber-neon/5 px-3 py-1 text-xs text-cyber-neon font-bold">
              <span className="w-2 h-2 rounded-full bg-cyber-neon animate-ping" />
              <span>{trackingActive ? 'GPS Sync On' : 'Offline'}</span>
            </div>
          </div>

          {/* Toggle form types: General vs Emergency */}
          <div className="flex bg-cyber-panel border border-cyber-border rounded-lg p-1 space-x-1">
            <button
              onClick={() => setIsEmergencyReport(false)}
              className={`flex-1 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                !isEmergencyReport
                  ? 'bg-cyber-accent text-white'
                  : 'text-cyber-text hover:text-cyber-heading'
              }`}
            >
              General Report
            </button>
            <button
              onClick={() => setIsEmergencyReport(true)}
              className={`flex-1 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isEmergencyReport
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-cyber-text hover:text-red-400'
              }`}
            >
              <Flame size={12} />
              Report Emergency
            </button>
          </div>

          {/* Twitter Card */}
          <div className={`glass-panel p-5 relative overflow-hidden transition-colors duration-300 ${isEmergencyReport ? 'border-red-500/30 bg-red-950/5' : ''}`}>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs ${
                  isEmergencyReport 
                    ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                    : 'bg-cyber-accent/20 border-cyber-accent/50 text-cyber-accent'
                }`}>
                  {isEmergencyReport ? '🚨' : 'CI'}
                </div>
              </div>

              <form onSubmit={submit} className="flex-1 space-y-3">
                {isEmergencyReport && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-red-400 font-bold uppercase">Incident Type:</span>
                    <select 
                      value={emergencyCategory}
                      onChange={(e) => setEmergencyCategory(e.target.value)}
                      className="bg-cyber-panel border border-cyber-border text-slate-100 text-xs rounded px-2 py-1 outline-none"
                    >
                      <option value="Fire">Fire / Explosion</option>
                      <option value="Flood">Flooding / Waterlogging</option>
                      <option value="Bee Attack">Bee / Wasp / Animal Attack</option>
                      <option value="Gas Leak">Gas Leak / Toxic Spill</option>
                      <option value="Structural Collapse">Building / Bridge Collapse</option>
                      <option value="Medical Emergency">Severe Accident / Medical</option>
                    </select>
                  </div>
                )}

                <textarea
                  value={isEmergencyReport ? emergencyText : text}
                  onChange={(e) => isEmergencyReport ? setEmergencyText(e.target.value) : setText(e.target.value)}
                  placeholder={isEmergencyReport ? "Describe the immediate threat (address, street landmarks, severity)..." : "What's happening in your neighborhood?"}
                  className="w-full min-h-24 bg-transparent text-slate-100 placeholder-slate-500 border-none outline-none resize-none text-base leading-relaxed"
                />

                {/* Attached media details */}
                {mediaUrl && (
                  <div className="relative inline-block mt-2">
                    <img 
                      src={`${API_BASE_URL}${mediaUrl}`} 
                      alt="Attachment Preview" 
                      className="h-20 rounded border border-cyber-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearMedia}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 rounded-full text-white p-0.5 hover:bg-red-700 cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}

                {/* Attached location telemetry */}
                {latitude !== null && longitude !== null && (
                  <div className="block mt-2">
                    <div className="inline-flex items-center gap-2 rounded-md border border-cyber-neon/30 bg-cyber-neon/10 px-2 py-0.5 text-xs text-cyber-neon font-medium animate-fade-in">
                      <Navigation size={11} className="animate-pulse" />
                      <span>GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                      <button
                        type="button"
                        onClick={clearGps}
                        className="rounded-full p-0.5 hover:bg-cyber-neon/20 transition-colors cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Media & GPS Attachment Control Panel */}
                <div className="flex items-center justify-between border-t border-cyber-border/60 pt-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="p-2 rounded-full hover:bg-cyber-border text-slate-400 hover:text-cyber-heading cursor-pointer transition-colors"
                      title="Attach Image"
                    >
                      {uploadingFile ? <Loader2 className="animate-spin text-cyber-accent" size={16} /> : <ImageIcon size={16} />}
                    </button>

                    <button
                      type="button"
                      onClick={handleGetGps}
                      disabled={fetchingGps}
                      className="p-2 rounded-full hover:bg-cyber-border text-slate-400 hover:text-cyber-heading cursor-pointer transition-colors"
                      title="Pin GPS Coordinates"
                    >
                      {fetchingGps ? <Loader2 className="animate-spin text-cyber-accent" size={16} /> : <MapPin size={16} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isEmergencyReport ? !emergencyText.trim() : !text.trim()}
                    className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold text-white transition-all cursor-pointer ${
                      isEmergencyReport
                        ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20'
                        : (text.trim() ? 'bg-cyber-accent hover:bg-cyber-accent/90 shadow-md shadow-cyber-accent/25' : 'bg-cyber-border text-slate-500 cursor-not-allowed')
                    }`}
                  >
                    <Send size={14} />
                    <span>{isEmergencyReport ? 'Broadcast Emergency' : 'Post Report'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Active Local news list */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-cyber-border pb-2">
              <RadioTower size={18} className="text-cyber-accent animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Local Activity in {selectedNeighborhood}
              </h3>
            </div>

            {/* Neighborhood Pill Group */}
            <div className="flex flex-wrap gap-1">
              {NEIGHBORHOODS.map((n) => (
                <button
                  key={n.name}
                  type="button"
                  onClick={() => setSelectedNeighborhood(n.name)}
                  className={`px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full transition-all border cursor-pointer ${
                    selectedNeighborhood === n.name
                      ? 'border-cyber-accent bg-cyber-accent/15 text-cyber-heading'
                      : 'border-cyber-border bg-cyber-border/20 text-cyber-text hover:text-cyber-heading'
                  }`}
                >
                  {detectedNeighborhood === n.name && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyber-neon mr-1 animate-pulse" />
                  )}
                  {n.name}
                </button>
              ))}
            </div>

            {/* Neighborhood filtered list */}
            <div className="space-y-3">
              {loading ? (
                <LoadingSkeleton />
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <div 
                    key={event.id || event.raw_text} 
                    onClick={() => handleEventClick(event)}
                    className="cursor-pointer hover:scale-[1.01] transition-transform duration-200"
                  >
                    <EventCard event={event} />
                  </div>
                ))
              ) : (
                <div className="glass-panel p-8 text-center border-dashed border-cyber-border">
                  <p className="text-sm font-bold text-slate-400">No active incidents found in {selectedNeighborhood}.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Emergency Numbers & Auto location display */}
        <div className="space-y-6">
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-cyber-heading flex items-center gap-2">
              <Phone className="text-red-500 animate-pulse" size={16} />
              Hotlines & Calling Desk
            </h3>
            
            <p className="text-xs text-cyber-text leading-relaxed">
              In case of critical hazards, dial these links to launch your phone communicator:
            </p>

            <div className="space-y-2">
              {[
                { name: 'Police Control Room', num: '100', color: 'hover:text-cyan-400 hover:border-cyan-500/40' },
                { name: 'Fire Department', num: '101', color: 'hover:text-orange-400 hover:border-orange-500/40' },
                { name: 'Ambulance Support', num: '102', color: 'hover:text-rose-400 hover:border-rose-500/40' },
                { name: 'Emergency Disaster Desk', num: '108', color: 'hover:text-red-400 hover:border-red-500/40' },
                { name: 'National Helpline (All-in-one)', num: '112', color: 'hover:text-cyber-neon hover:border-cyber-neon/40' }
              ].map((hotline) => (
                <a
                  key={hotline.num}
                  href={`tel:${hotline.num}`}
                  className={`flex items-center justify-between border border-cyber-border bg-cyber-dark/40 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-slate-300 ${hotline.color}`}
                >
                  <span>{hotline.name}</span>
                  <span className="font-mono text-cyber-accent bg-cyber-panel border border-cyber-border px-2 py-0.5 rounded">
                    {hotline.num}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Current telemetry watch parameters */}
          <div className="glass-panel p-5 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Telemetry Sync</span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-cyber-border/40 pb-1.5">
                <span className="text-slate-500">Live Latitude:</span>
                <span className="font-mono text-slate-300">{userLat ? userLat.toFixed(5) : 'Scanning...'}</span>
              </div>
              <div className="flex justify-between border-b border-cyber-border/40 pb-1.5">
                <span className="text-slate-500">Live Longitude:</span>
                <span className="font-mono text-slate-300">{userLng ? userLng.toFixed(5) : 'Scanning...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Zone:</span>
                <strong className="text-cyber-neon font-bold">{detectedNeighborhood || 'Locating...'}</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Structured summary popup modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-xl p-6 relative flex flex-col max-h-[85vh] border-cyber-accent/30 shadow-[0_0_30px_rgba(176,92,255,0.15)] animate-scale-up">
            
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <div className="flex items-center gap-2 text-cyber-accent">
                <Sparkles size={18} className="animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider">AI Event Summary Profile</h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-200 hover:bg-cyber-border/40 rounded-full p-1 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {summarizing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 size={32} className="animate-spin text-cyber-accent" />
                  <p className="text-xs text-cyber-text/80 animate-pulse">Engaging T5 summarization model...</p>
                </div>
              ) : summaryData ? (
                <div className="space-y-4">
                  
                  {/* Category, Area, Street, Severity details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="glass-panel/60 p-3">
                      <span className="text-[10px] text-cyber-text/60 uppercase block font-semibold mb-1">Locality/Neighborhood</span>
                      <strong className="text-cyber-heading text-sm">{summaryData.location}</strong>
                    </div>
                    <div className="glass-panel/60 p-3">
                      <span className="text-[10px] text-cyber-text/60 uppercase block font-semibold mb-1">Event Category</span>
                      <strong className="text-cyber-neon text-sm uppercase">{summaryData.category}</strong>
                    </div>
                    <div className="glass-panel/60 p-3">
                      <span className="text-[10px] text-cyber-text/60 uppercase block font-semibold mb-1">Extracted Street Landmark</span>
                      <strong className="text-slate-200 text-xs">{summaryData.street}</strong>
                    </div>
                    <div className="glass-panel/60 p-3">
                      <span className="text-[10px] text-cyber-text/60 uppercase block font-semibold mb-1">Intensity / Severity</span>
                      <strong className="text-red-400 text-xs">{summaryData.intensity}</strong>
                    </div>
                  </div>

                  {/* Render photo if uploaded */}
                  {summaryData.media && (
                    <div className="glass-panel border-cyber-border/45 overflow-hidden">
                      <span className="text-[10px] text-cyber-accent uppercase font-bold tracking-widest px-3 pt-3 block">Uploaded Evidence Photo</span>
                      <div className="p-3">
                        <img 
                          src={summaryData.media} 
                          alt="Citizen Uploaded Evidence" 
                          className="w-full max-h-56 object-cover rounded-lg border border-cyber-border/50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Description structured details block */}
                  <div className="glass-panel bg-cyber-dark/40 border-cyber-border/50 p-4 leading-relaxed text-slate-100 text-sm border-l-4 border-l-cyber-accent">
                    <span className="text-[10px] text-cyber-accent uppercase font-bold tracking-widest block mb-2">T5 AI SUMMARY</span>
                    {summaryData.summary}
                  </div>

                  {/* Source Post details */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-cyber-text/60 uppercase font-semibold block">Citizen Statement</span>
                    <div className="glass-panel/30 border border-cyber-border/30 px-3 py-2 text-xs text-slate-400 italic">
                      "{selectedEvent.raw_text}"
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-red-300">
                  <AlertTriangle className="mx-auto mb-2" size={24} />
                  Failed to load event data.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="border-t border-cyber-border pt-3 flex justify-end">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="bg-cyber-border hover:bg-cyber-border/80 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-md text-cyber-heading cursor-pointer transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

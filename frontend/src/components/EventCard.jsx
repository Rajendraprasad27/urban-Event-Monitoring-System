import { AlertTriangle, Clock, MapPin, Radio, Zap } from 'lucide-react';

const colors = {
  Traffic: 'text-amber-300 border-amber-300/30 bg-amber-300/10',
  Flood: 'text-cyan-300 border-cyan-300/30 bg-cyan-300/10',
  Accident: 'text-rose-300 border-rose-300/30 bg-rose-300/10',
  'Public Gathering': 'text-violet-300 border-violet-300/30 bg-violet-300/10',
  Emergency: 'text-red-300 border-red-300/30 bg-red-300/10',
};

export default function EventCard({ event }) {
  return (
    <article className="glass-panel p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${colors[event.category] || 'text-slate-300 border-slate-500/30 bg-slate-500/10'}`}>
              {event.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400"><Radio size={13} />{event.source}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-200">{event.raw_text}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin size={13} className={event.latitude && event.longitude && !event.locations?.length ? "text-cyber-neon" : ""} />
              {event.locations && event.locations.length > 0 
                ? event.locations.join(', ') 
                : (event.latitude && event.longitude 
                    ? `GPS: ${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}` 
                    : 'Location pending'
                  )
              }
            </span>
            <span className="flex items-center gap-1"><Zap size={13} />{Math.round((event.confidence || 0) * 100)}% confidence</span>
            {event.created_at && (
              <span className="flex items-center gap-1"><Clock size={13} />{new Date(event.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold uppercase ${event.severity === 'high' ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
          <AlertTriangle size={13} />{event.severity}
        </div>
      </div>
    </article>
  );
}

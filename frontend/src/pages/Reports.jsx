import { Download, Search } from 'lucide-react';
import EventCard from '../components/EventCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useEvents } from '../hooks/useEvents';

export default function Reports() {
  const { events, loading } = useEvents();

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'citymind-events-report.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyber-neon">Event history</p>
          <h2 className="mt-2 text-3xl font-black text-cyber-heading">Reports</h2>
        </div>
        <button onClick={exportJson} className="inline-flex items-center gap-2 rounded-md border border-cyber-accent/40 bg-cyber-accent/15 px-4 py-2 text-sm font-bold text-cyber-accent">
          <Download size={16} /> Export JSON
        </button>
      </div>
      <div className="glass-panel flex items-center gap-2 p-3">
        <Search size={16} />
        <input className="w-full bg-transparent text-sm outline-none" placeholder="Search reports by location, category, source..." />
      </div>
      {loading ? <LoadingSkeleton rows={6} /> : <div className="grid gap-3 xl:grid-cols-2">{events.map((event) => <EventCard key={event.id || event.raw_text} event={event} />)}</div>}
    </section>
  );
}

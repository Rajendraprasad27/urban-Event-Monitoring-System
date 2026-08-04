import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BrainCircuit, RadioTower } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EventCard from '../components/EventCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import StatCard from '../components/StatCard';
import { analyticsService, monitoringService } from '../services/api';
import { useEvents } from '../hooks/useEvents';

export default function Dashboard() {
  const { events, loading, error, liveStatus, metrics, reload } = useEvents();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    analyticsService.overview().then(setAnalytics).catch(() => {});
  }, [events.length]);

  const simulate = async () => {
    await monitoringService.simulate();
    await reload();
  };

  return (
    <section className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyber-neon">Real-time command center</p>
          <h2 className="mt-2 text-3xl font-black text-cyber-heading">Urban Event Dashboard</h2>
        </div>
        <button onClick={simulate} className="rounded-md border border-cyber-accent/40 bg-cyber-accent/15 px-4 py-2 text-sm font-bold text-cyber-accent">
          Simulate live event
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active events" value={analytics?.active_events ?? metrics.total} icon={Activity} accent="text-cyber-neon" />
        <StatCard label="High severity" value={analytics?.high_heat_zones ?? metrics.high} icon={AlertTriangle} accent="text-red-300" />
        <StatCard label="AI confidence" value={`${analytics?.ai_confidence ?? metrics.avgConfidence}%`} icon={BrainCircuit} accent="text-violet-300" />
        <StatCard label="Stream" value={liveStatus} icon={RadioTower} accent="text-emerald-300" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="glass-panel p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Category distribution</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={analytics?.category_distribution || []}>
                <CartesianGrid stroke="#22232e" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232e' }} />
                <Bar dataKey="value" fill="#00ffcc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Latest intelligence</h3>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {loading ? <LoadingSkeleton /> : events.slice(0, 4).map((event) => <EventCard key={event.id || event.raw_text} event={event} />)}
        </div>
      </div>
    </section>
  );
}

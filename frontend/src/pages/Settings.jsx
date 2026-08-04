import { useState } from 'react';
import { Moon, RadioTower, Shield } from 'lucide-react';

export default function Settings() {
  const [models, setModels] = useState(false);
  const [alerts, setAlerts] = useState(true);

  return (
    <section className="max-w-4xl space-y-6 p-6 md:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyber-neon">Control plane</p>
        <h2 className="mt-2 text-3xl font-black text-cyber-heading">Settings</h2>
      </div>
      {[
        ['Enable transformer models', 'Uses local or downloaded HuggingFace models when backend ENABLE_AI_MODELS=true.', models, setModels, Shield],
        ['Realtime notifications', 'Show high-severity event notifications from the websocket stream.', alerts, setAlerts, RadioTower],
        ['Dark operations theme', 'Dashboard is optimized for low-light monitoring rooms.', true, () => {}, Moon],
      ].map(([title, copy, value, setter, Icon]) => (
        <div key={title} className="glass-panel flex items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            <Icon className="mt-1 text-cyber-accent" />
            <div>
              <h3 className="font-bold text-cyber-heading">{title}</h3>
              <p className="mt-1 text-sm text-slate-400">{copy}</p>
            </div>
          </div>
          <button onClick={() => setter(!value)} className={`h-7 w-12 rounded-full p-1 transition-colors ${value ? 'bg-cyber-accent' : 'bg-slate-700'}`}>
            <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      ))}
    </section>
  );
}

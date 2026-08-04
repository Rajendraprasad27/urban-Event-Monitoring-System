import { Brain, Activity, Cpu, Map, ShieldAlert } from 'lucide-react';
import RightSidebar from '../components/RightSidebar';

export default function AiInsights() {
  return (
    <div className="flex h-full w-full">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">AI <span className="text-cyber-heading">Insights</span></h2>
          <p className="text-xs text-cyber-text font-mono uppercase tracking-widest">Claude Sonnet · Live Cluster Analysis</p>
        </div>

        {/* SYSTEM SUMMARY */}
        <div className="glass-panel p-6 border-cyber-accent/30 mb-6">
          <div className="flex items-center justify-between mb-6 text-xs font-bold text-cyber-accent uppercase tracking-widest">
            <div className="flex items-center space-x-2">
              <Brain size={16} />
              <span>System Summary</span>
            </div>
            <span className="text-cyber-text/50">CONF · 92%</span>
          </div>
          <p className="text-lg text-cyber-heading font-mono">Calibrating signals...</p>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          <StatCard title="Active Events" value="0" icon={Activity} color="text-cyber-accent" />
          <StatCard title="Citizen Reports" value="0" icon={Cpu} color="text-cyan-400" />
          <StatCard title="High Heat Zones" value="0" icon={Map} color="text-rose-500" />
          <StatCard title="AI Confidence" value="92%" icon={ShieldAlert} color="text-green-400" />
        </div>

        {/* CATEGORY DISTRIBUTION */}
        <div className="mb-10">
          <h3 className="text-sm font-bold text-cyber-heading uppercase tracking-widest mb-6">Category Distribution</h3>
          <div className="h-32 flex items-center justify-center border border-dashed border-cyber-border/50 rounded-xl">
            <span className="text-cyber-text/30 font-mono text-sm">Gathering distribution data...</span>
          </div>
        </div>

        {/* HOTTEST CLUSTERS */}
        <div>
          <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-6">Hottest Clusters</h3>
          <div className="h-32 flex items-center justify-center border border-dashed border-cyber-border/50 rounded-xl">
            <span className="text-cyber-text/30 font-mono text-sm">Waiting for cluster formation...</span>
          </div>
        </div>
      </div>
      
      <RightSidebar />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="glass-panel p-5 border-cyber-border/50 bg-cyber-dark/40">
      <div className="flex justify-between items-start mb-4">
        <div className="text-[10px] font-bold text-cyber-text uppercase tracking-widest w-2/3">{title}</div>
        <Icon size={14} className={color} />
      </div>
      <div className={`text-4xl font-black ${color}`}>{value}</div>
    </div>
  );
}

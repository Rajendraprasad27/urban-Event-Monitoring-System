import { Brain, Activity, Flame } from 'lucide-react';

export default function RightSidebar() {
  return (
    <aside className="w-80 border-l border-cyber-border bg-cyber-dark p-6 flex flex-col space-y-6 flex-shrink-0 overflow-y-auto">
      
      {/* AI INSIGHTS BLOCK */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-4 text-xs font-bold text-cyber-accent tracking-widest uppercase">
          <div className="flex items-center space-x-2">
            <Brain size={14} />
            <span>AI Insights</span>
          </div>
          <span className="text-cyber-text/50">CONF · 92%</span>
        </div>
        
        <p className="text-sm text-cyber-heading/80 font-mono mb-6 leading-relaxed">
          CITYMIND AI is calibrating signals across Bengaluru...
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-panel bg-cyber-dark/50 p-3 rounded-lg border-cyber-border/50">
            <div className="text-xs text-cyber-text mb-1">Events</div>
            <div className="text-xl font-bold text-cyber-accent">0</div>
          </div>
          <div className="glass-panel bg-cyber-dark/50 p-3 rounded-lg border-cyber-border/50">
            <div className="text-xs text-cyber-text mb-1">Reports</div>
            <div className="text-xl font-bold text-cyan-400">0</div>
          </div>
        </div>
      </div>

      {/* CATEGORY HEAT BLOCK */}
      <div className="glass-panel p-4">
        <div className="flex items-center space-x-2 mb-6 text-xs font-bold text-cyber-heading tracking-widest uppercase">
          <Activity size={14} />
          <span>Category Heat</span>
        </div>
        
        <div className="space-y-4">
          {[
            { name: 'TRAFFIC', color: 'bg-rose-500' },
            { name: 'EVENT', color: 'bg-green-500' },
            { name: 'ACCIDENT', color: 'bg-amber-500' },
            { name: 'WEATHER', color: 'bg-blue-500' },
          ].map((cat) => (
            <div key={cat.name}>
              <div className="flex justify-between text-[10px] font-bold mb-1 tracking-wider">
                <span className={`text-${cat.color.split('-')[1]}-400`}>{cat.name}</span>
                <span className="text-cyber-text/50">0</span>
              </div>
              <div className="h-1 bg-cyber-dark rounded-full overflow-hidden">
                <div className={`h-full ${cat.color} w-0`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP TRENDING BLOCK */}
      <div className="glass-panel p-4">
        <div className="flex items-center space-x-2 mb-4 text-xs font-bold tracking-widest uppercase text-amber-500">
          <Flame size={14} />
          <span>Top Trending</span>
        </div>
        <p className="text-sm text-cyber-text font-mono">Awaiting signals...</p>
      </div>

    </aside>
  );
}

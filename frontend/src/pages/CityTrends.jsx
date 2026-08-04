import RightSidebar from '../components/RightSidebar';

export default function CityTrends() {
  return (
    <div className="flex h-full w-full">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-amber-500 mb-2">City-Wide <span className="text-white">Trends</span></h2>
          <p className="text-xs text-cyber-text font-mono uppercase tracking-widest">Aggregated signals across all Bengaluru zones</p>
        </div>

        {/* Table Header */}
        <div className="glass-panel flex items-center px-4 py-3 mb-6 bg-cyber-panel/50 border-cyber-border/50 text-[10px] font-bold text-cyber-text/70 uppercase tracking-widest">
          <div className="w-12">#</div>
          <div className="flex-1">Event</div>
          <div className="w-32 text-center">Category</div>
          <div className="w-48 text-center">Location</div>
          <div className="w-24 text-right">Score</div>
        </div>

        {/* Deep Dive Section */}
        <div className="mt-12">
          <h3 className="text-sm font-bold text-cyber-accent uppercase tracking-widest mb-6">Deep-Dive Cards</h3>
          
          <div className="flex items-center justify-center h-64 border border-dashed border-cyber-border/50 rounded-xl">
            <span className="text-cyber-text/30 font-mono text-sm">No active trends currently being monitored.</span>
          </div>
        </div>
      </div>
      
      <RightSidebar />
    </div>
  );
}

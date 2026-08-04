export default function Profile() {
  return (
    <div className="flex h-full w-full">
      <div className="flex-1 p-8 overflow-y-auto max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-cyber-accent mb-2">Profile</h2>
        </div>

        {/* PROFILE CARD */}
        <div className="glass-panel p-8 mb-6 bg-gradient-to-r from-cyber-panel/80 to-cyber-dark/80">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-cyber-dark border-2 border-cyber-accent/50 shadow-[0_0_20px_rgba(176,92,255,0.4)] overflow-hidden flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-cyber-panel to-cyber-dark relative">
                {/* Silhouette placeholder */}
                <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 text-cyber-text/30" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-cyber-heading mb-1">Citizen Reporter</h3>
              <p className="text-sm font-mono text-cyber-text/70 mb-3">@citizen · Bengaluru</p>
              <p className="text-xs font-mono text-cyber-text">
                142 signals broadcast · 38 events clustered · trust score 87
              </p>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-6">
          <StatCard title="Reports" value="142" color="text-cyber-accent" />
          <StatCard title="Followers" value="1.2k" color="text-cyan-400" />
          <StatCard title="Trust" value="87" color="text-green-400" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className="glass-panel p-6 border-cyber-border/50 bg-cyber-dark/40">
      <div className="text-[10px] font-bold text-cyber-text uppercase tracking-widest mb-4">{title}</div>
      <div className={`text-4xl font-black ${color}`}>{value}</div>
    </div>
  );
}

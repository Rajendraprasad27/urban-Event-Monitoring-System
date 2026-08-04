import { Bell, LogOut, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="relative z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-cyber-border bg-cyber-dark px-4 md:px-6">
      <div className="flex w-auto flex-shrink-0 items-center space-x-3 md:w-64">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-cyber-accent/50 bg-cyber-accent/20 font-bold text-cyber-accent shadow-[0_0_10px_rgba(176,92,255,0.3)]">
          C
        </div>
        <div>
          <h1 className="text-sm font-bold leading-none tracking-widest text-cyber-heading">CITYMIND</h1>
          <p className="mt-1 text-[10px] tracking-widest text-cyber-text">AI URBAN OPS</p>
        </div>
      </div>
      <div className="hidden flex-1 justify-center px-4 md:flex">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text/50" size={16} />
          <input
            type="text"
            placeholder="Search events, locations, sources..."
            className="w-full rounded-md border border-cyber-border bg-cyber-panel/50 py-2 pl-10 pr-4 text-sm text-cyber-heading transition-colors focus:border-cyber-accent/50 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center justify-end space-x-3 md:w-64">
        <div className="hidden items-center space-x-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-semibold tracking-wider text-green-400 sm:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span>LIVE</span>
        </div>
        <button className="relative p-2 text-cyber-text transition-colors hover:text-cyber-heading" title="Notifications">
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyber-border bg-cyber-panel font-bold text-cyber-text">
          {(user?.name || 'Analyst').slice(0, 2).toUpperCase()}
        </div>
        <button onClick={logout} className="p-2 text-cyber-text transition-colors hover:text-cyber-heading" title="Log out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

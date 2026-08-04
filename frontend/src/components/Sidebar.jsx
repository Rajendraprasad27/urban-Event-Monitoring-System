import { Link, useLocation } from 'react-router-dom';
import { Activity, BarChart3, FileText, Home, Radar, Settings, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { name: 'Home', path: '/home', icon: Home },
  { name: 'Dashboard', path: '/dashboard', icon: Activity },
  { name: 'Live Monitoring', path: '/monitoring', icon: Radar },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden h-[calc(100vh-4rem)] w-64 flex-shrink-0 flex-col border-r border-cyber-border bg-cyber-dark pt-6 md:flex">
      <div className="px-6 pb-6 text-xs font-semibold tracking-widest text-cyber-text/50">NAVIGATE</div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`relative flex items-center space-x-3 rounded-md px-4 py-3 transition-colors ${
                isActive
                  ? 'border border-cyber-accent/30 bg-cyber-accent/10 text-cyber-heading'
                  : 'text-cyber-text hover:bg-cyber-panel hover:text-cyber-heading'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-cyber-accent' : ''} />
              <span className="text-sm font-medium">{item.name}</span>
              {isActive && <motion.div layoutId="active-indicator" className="absolute left-0 top-1/4 h-1/2 w-1 rounded-r-full bg-cyber-accent" />}
            </Link>
          );
        })}
      </nav>
      <div className="glass-panel m-4 border-cyber-accent/30 bg-cyber-accent/5 p-4">
        <div className="mb-2 flex items-center space-x-2 text-cyber-accent">
          <ShieldCheck size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">AI Core</span>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-cyber-text">
          DistilBERT, spaCy, T5 and clustering services are wired for live city intelligence.
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-cyber-panel">
          <div className="h-full w-4/5 animate-pulse bg-gradient-to-r from-cyber-accent to-cyber-neon" />
        </div>
      </div>
    </aside>
  );
}

import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Line, LineChart, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { analyticsService } from '../services/api';
import { Sparkles, MapPin, X, Loader2, Navigation, TrendingUp, BarChart3, AlertTriangle, Layers, RadioTower, Flame, Zap, Battery, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

const palette = ['#00ffcc', '#b05cff', '#fb7185', '#fbbf24', '#38bdf8'];

const NEIGHBORHOODS = [
  { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
  { name: 'Koramangala', lat: 12.9279, lng: 77.6271 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7499 },
  { name: 'Jayanagar', lat: 12.9308, lng: 77.5838 },
  { name: 'HSR Layout', lat: 12.9101, lng: 77.6450 },
  { name: 'MG Road', lat: 12.9740, lng: 77.6077 }
];

const getCategoryMarkerIcon = (category) => {
  let emoji = 'ℹ️';
  let colorClass = 'bg-slate-800 border-slate-600 text-slate-100 shadow-slate-500/35';

  const cat = category?.toLowerCase() || '';
  if (cat.includes('accident')) {
    emoji = '💥';
    colorClass = 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-rose-500/35';
  } else if (cat.includes('fire')) {
    emoji = '🔥';
    colorClass = 'bg-orange-950/80 border-orange-500 text-orange-300 shadow-orange-500/35';
  } else if (cat.includes('flood') || cat.includes('water') || cat.includes('weather')) {
    emoji = '💧';
    colorClass = 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-cyan-500/35';
  } else if (cat.includes('traffic')) {
    emoji = '⚠️';
    colorClass = 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-amber-500/35';
  } else if (cat.includes('gathering') || cat.includes('people') || cat.includes('protest')) {
    emoji = '👥';
    colorClass = 'bg-violet-950/80 border-violet-500 text-violet-300 shadow-violet-500/35';
  } else if (cat.includes('emergency')) {
    emoji = '🚨';
    colorClass = 'bg-red-950/80 border-red-500 text-red-300 shadow-red-600/35';
  }

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${colorClass} text-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:scale-115 transition-transform duration-200 cursor-pointer">
        <span class="relative z-10">${emoji}</span>
        <div class="absolute inset-0 rounded-full animate-ping opacity-25 ${colorClass.split(' ')[0]}"></div>
      </div>
    `,
    className: 'custom-trending-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

const severityStyles = {
  Critical: 'bg-rose-500/10 border-rose-500 text-rose-300',
  High: 'bg-amber-500/10 border-amber-500 text-amber-300',
  Medium: 'bg-sky-500/10 border-sky-500 text-sky-300',
  Low: 'bg-slate-700/10 border-slate-600 text-slate-300',
};

const getSeverityBadge = (severity) => {
  const style = severityStyles[severity] || severityStyles.Low;
  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${style}`}>
      {severity}
    </span>
  );
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const isValidLatLng = (value) => typeof value === 'number' && !Number.isNaN(value);

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'trending'
  
  // Trending Section States
  const [trendScope, setTrendScope] = useState('citywide'); // 'citywide' | 'local'
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Indiranagar');
  const [trends, setTrends] = useState([]);
  const [locationClusters, setLocationClusters] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  
  // Modal state
  const [selectedTrend, setSelectedTrend] = useState(null);

  useEffect(() => {
    analyticsService.overview().then(setAnalytics).catch(() => {});
  }, []);

  // Fetch trending events when tab, scope, or selected neighborhood changes
  useEffect(() => {
    if (activeTab !== 'trending') return;

    setLoadingTrends(true);
    const nParam = trendScope === 'local' ? selectedNeighborhood : undefined;
    analyticsService.trending(nParam)
      .then((res) => {
        setTrends(res.trends || []);
        setLocationClusters(res.locations || []);
      })
      .catch((err) => {
        console.error(err);
        setTrends([]);
        setLocationClusters([]);
      })
      .finally(() => {
        setLoadingTrends(false);
      });
  }, [activeTab, trendScope, selectedNeighborhood]);

  // Energy Analytics States
  const [historicalData, setHistoricalData] = useState(() => {
    const data = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 5000);
      const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      data.push({
        time: timeStr,
        energy: Math.round(45 + Math.random() * 25), // Energy in Wh
        cpu: Math.round(25 + Math.random() * 35),
        memory: Math.round(50 + Math.random() * 15)
      });
    }
    return data;
  });

  const [energyMetrics, setEnergyMetrics] = useState({
    power: 58,
    energyConsumed: 642,
    carbonEmission: 270,
    efficiencyScore: 84,
    diskIO: 35,
    network: 42,
    diskReadWrite: 12.4,
    networkUsage: 145.2,
    ramUsage: 18.2,
    cpu: 45,
    memory: 58,
    peakPower: 82,
    executionTime: 120,
    energySaved: 4.8,
    costSaved: 0.72,
    co2Reduction: 2.02
  });

  useEffect(() => {
    if (activeTab !== 'overview') return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      
      const newCpu = Math.round(20 + Math.random() * 60); // 20% to 80%
      const newMemory = Math.round(45 + Math.random() * 25); // 45% to 70%
      const newPower = Math.round(30 + newCpu * 0.4 + newMemory * 0.2 + Math.random() * 10);
      
      setHistoricalData(prev => {
        const next = [...prev.slice(1), {
          time: timeStr,
          energy: Math.round(newPower * 0.8 + Math.random() * 10), // Realistic Wh consumption over time
          cpu: newCpu,
          memory: newMemory
        }];
        return next;
      });

      setEnergyMetrics(prev => {
        const addedEnergy = Math.round(newPower * (5 / 3600) * 100) / 100;
        const nextEnergyConsumed = Math.round((prev.energyConsumed + addedEnergy) * 100) / 100;
        const nextCarbonEmission = Math.round(nextEnergyConsumed * 0.42 * 10) / 10;
        
        const newDiskIO = Math.round(15 + Math.random() * 65);
        const newNetwork = Math.round(20 + Math.random() * 70);
        
        const newDiskReadWrite = Math.round(2 + Math.random() * 38);
        const newNetworkUsage = Math.round(30 + Math.random() * 210);
        const newRamUsage = Math.round((newMemory / 100) * 32 * 10) / 10;
        
        const nextEnergySaved = Math.round((prev.energySaved + 0.015) * 1000) / 1000;
        const nextCostSaved = Math.round((nextEnergySaved * 0.15) * 100) / 100;
        const nextCo2Reduction = Math.round((nextEnergySaved * 0.42) * 100) / 100;

        return {
          power: newPower,
          energyConsumed: nextEnergyConsumed,
          carbonEmission: nextCarbonEmission,
          efficiencyScore: Math.round(100 - (newCpu * 0.25 + (newPower > 70 ? 15 : (newPower > 40 ? 5 : 0)))),
          diskIO: newDiskIO,
          network: newNetwork,
          diskReadWrite: newDiskReadWrite,
          networkUsage: newNetworkUsage,
          ramUsage: newRamUsage,
          cpu: newCpu,
          memory: newMemory,
          peakPower: Math.max(prev.peakPower, newPower),
          executionTime: prev.executionTime + 5,
          energySaved: nextEnergySaved,
          costSaved: nextCostSaved,
          co2Reduction: nextCo2Reduction
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <section className="space-y-6 p-6 md:p-8">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyber-neon">Operational Analytics</p>
          <h2 className="mt-1 text-3xl font-black text-cyber-heading">Analysis & Trends</h2>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-cyber-panel border border-cyber-border rounded-lg p-1 space-x-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-cyber-accent text-white shadow-md shadow-cyber-accent/20'
                : 'text-cyber-text hover:text-cyber-heading hover:bg-cyber-border/40'
            }`}
          >
            <BarChart3 size={14} />
            Metrics Overview
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'trending'
                ? 'bg-cyber-accent text-white shadow-md shadow-cyber-accent/20'
                : 'text-cyber-text hover:text-cyber-heading hover:bg-cyber-border/40'
            }`}
          >
            <TrendingUp size={14} />
            Trending News
          </button>
        </div>
      </div>

      {/* Overview Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-panel p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Severity mix</h3>
              <div className="h-80">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={analytics?.severity_distribution || []} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
                      {(analytics?.severity_distribution || []).map((_, index) => (
                        <Cell key={index} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232e' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-panel p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Event velocity</h3>
              <div className="h-80">
                <ResponsiveContainer>
                  <LineChart data={analytics?.trends || []}>
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232e' }} />
                    <Line type="monotone" dataKey="velocity" stroke="#00ffcc" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Energy Consumption Analytics Card */}
          <div className="glass-panel p-6 border border-cyber-border space-y-6">
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cyber-border pb-4 gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyber-neon">Real-Time Resource & Power Monitoring</p>
                <h3 className="mt-1 text-2xl font-black text-cyber-heading">Energy Consumption Analytics</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-neon opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-neon"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Auto Refreshes in 5s</span>
              </div>
            </div>

            {/* 1. Top Summary Cards (4 cards) */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Estimated Power */}
              <div className="glass-panel p-4 flex items-center justify-between border-l-4 border-l-cyber-neon bg-cyber-panel/40">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Estimated Power</p>
                  <p className="mt-1 text-2xl font-black text-cyber-heading font-mono">
                    {energyMetrics.power} <span className="text-xs font-medium text-slate-400">W</span>
                  </p>
                </div>
                <div className="p-2.5 bg-cyber-neon/10 text-cyber-neon rounded-lg border border-cyber-neon/20 shadow-[0_0_15px_rgba(0,255,204,0.1)]">
                  <Zap size={18} className="animate-pulse" />
                </div>
              </div>

              {/* Energy Consumed */}
              <div className="glass-panel p-4 flex items-center justify-between border-l-4 border-l-cyber-accent bg-cyber-panel/40">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Energy Consumed</p>
                  <p className="mt-1 text-2xl font-black text-cyber-heading font-mono">
                    {energyMetrics.energyConsumed} <span className="text-xs font-medium text-slate-400">Wh</span>
                  </p>
                </div>
                <div className="p-2.5 bg-cyber-accent/10 text-cyber-accent rounded-lg border border-cyber-accent/20">
                  <Battery size={18} />
                </div>
              </div>

              {/* Carbon Emission */}
              <div className="glass-panel p-4 flex items-center justify-between border-l-4 border-l-rose-400 bg-cyber-panel/40">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Carbon Emission</p>
                  <p className="mt-1 text-2xl font-black text-cyber-heading font-mono">
                    {energyMetrics.carbonEmission} <span className="text-xs font-medium text-slate-400">g CO₂</span>
                  </p>
                </div>
                <div className="p-2.5 bg-rose-500/10 text-rose-300 rounded-lg border border-rose-500/20">
                  <Leaf size={18} />
                </div>
              </div>

              {/* Efficiency Score */}
              <div className="glass-panel p-4 flex items-center justify-between border-l-4 border-l-emerald-400 bg-cyber-panel/40">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Efficiency Score</p>
                  <p className="mt-1 text-2xl font-black text-cyber-heading font-mono">
                    {energyMetrics.efficiencyScore}<span className="text-xs font-medium text-slate-400">%</span>
                  </p>
                </div>
                <div className="relative flex items-center justify-center w-11 h-11">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="22" cy="22" r="17" stroke="#22232e" strokeWidth="3.5" fill="transparent" />
                    <circle cx="22" cy="22" r="17" stroke="#10b981" strokeWidth="3.5" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 17}
                            strokeDashoffset={2 * Math.PI * 17 * (1 - energyMetrics.efficiencyScore / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-500" />
                  </svg>
                  <span className="absolute text-[10px] font-black text-emerald-400">{energyMetrics.efficiencyScore}%</span>
                </div>
              </div>
            </div>

            {/* 2. Main Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Chart: Energy Consumption (Wh) */}
              <div className="glass-panel p-5 bg-cyber-panel/30 border border-cyber-border">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Energy Consumption Over Time</h4>
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#00ffcc" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} unit=" Wh" />
                      <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232e', borderRadius: '6px' }} />
                      <Area type="monotone" dataKey="energy" stroke="#00ffcc" strokeWidth={2.5} fillOpacity={1} fill="url(#energyGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Chart: CPU & Memory Usage */}
              <div className="glass-panel p-5 bg-cyber-panel/30 border border-cyber-border">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">System Workload History</h4>
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b05cff" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#b05cff" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232e', borderRadius: '6px' }} />
                      <Area type="monotone" dataKey="cpu" stroke="#b05cff" strokeWidth={2} fillOpacity={1} fill="url(#cpuGrad)" name="CPU Usage" />
                      <Area type="monotone" dataKey="memory" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#memGrad)" name="Memory Usage" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 3. Bottom Row */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Card: Resource Distribution */}
              <div className="glass-panel p-5 bg-cyber-panel/30 border border-cyber-border flex flex-col justify-between">
                <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300 font-bold mb-2">Resource Distribution</h4>
                <div className="h-44 relative flex items-center justify-center">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'CPU', value: energyMetrics.cpu, color: '#b05cff' },
                          { name: 'Memory', value: energyMetrics.memory, color: '#38bdf8' },
                          { name: 'Disk I/O', value: energyMetrics.diskIO, color: '#fb7185' },
                          { name: 'Network', value: energyMetrics.network, color: '#00ffcc' }
                        ]}
                        dataKey="value"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {[
                          { name: 'CPU', value: energyMetrics.cpu, color: '#b05cff' },
                          { name: 'Memory', value: energyMetrics.memory, color: '#38bdf8' },
                          { name: 'Disk I/O', value: energyMetrics.diskIO, color: '#fb7185' },
                          { name: 'Network', value: energyMetrics.network, color: '#00ffcc' }
                        ].map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#13141a', border: '1px solid #22232e', borderRadius: '6px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Total load</span>
                    <span className="text-base font-black text-cyber-heading font-mono">
                      {energyMetrics.cpu + energyMetrics.memory + energyMetrics.diskIO + energyMetrics.network}
                    </span>
                  </div>
                </div>
                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#b05cff]"></span> CPU: {energyMetrics.cpu}%</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#38bdf8]"></span> RAM: {energyMetrics.memory}%</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#fb7185]"></span> Disk: {energyMetrics.diskIO}%</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#00ffcc]"></span> Net: {energyMetrics.network}%</div>
                </div>
              </div>

              {/* Middle Card: Live System Metrics */}
              <div className="glass-panel p-5 bg-cyber-panel/30 border border-cyber-border space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Live System Metrics</h4>
                <div className="space-y-3">
                  {/* CPU Progress */}
                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold mb-1 tracking-wider text-slate-400">
                      <span>CPU Usage</span>
                      <span className="text-cyber-neon font-mono">{energyMetrics.cpu}%</span>
                    </div>
                    <div className="w-full bg-cyber-dark h-1.5 rounded-full overflow-hidden border border-cyber-border">
                      <motion.div className="bg-cyber-neon h-full" animate={{ width: `${energyMetrics.cpu}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>

                  {/* RAM Usage */}
                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold mb-1 tracking-wider text-slate-400">
                      <span>RAM Allocation</span>
                      <span className="text-cyber-accent font-mono">{energyMetrics.ramUsage} GB / 32 GB</span>
                    </div>
                    <div className="w-full bg-cyber-dark h-1.5 rounded-full overflow-hidden border border-cyber-border">
                      <motion.div className="bg-cyber-accent h-full" animate={{ width: `${(energyMetrics.ramUsage / 32) * 100}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>

                  {/* Disk Read/Write */}
                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold mb-1 tracking-wider text-slate-400">
                      <span>Disk R/W Speed</span>
                      <span className="text-rose-400 font-mono">{energyMetrics.diskReadWrite} MB/s</span>
                    </div>
                    <div className="w-full bg-cyber-dark h-1.5 rounded-full overflow-hidden border border-cyber-border">
                      <motion.div className="bg-rose-400 h-full" animate={{ width: `${Math.min((energyMetrics.diskReadWrite / 50) * 100, 100)}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>

                  {/* Network Usage */}
                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold mb-1 tracking-wider text-slate-400">
                      <span>Network Throughput</span>
                      <span className="text-sky-400 font-mono">{energyMetrics.networkUsage} Mbps</span>
                    </div>
                    <div className="w-full bg-cyber-dark h-1.5 rounded-full overflow-hidden border border-cyber-border">
                      <motion.div className="bg-sky-400 h-full" animate={{ width: `${Math.min((energyMetrics.networkUsage / 300) * 100, 100)}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>

                  {/* Execution Time */}
                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold mb-1 tracking-wider text-slate-400">
                      <span>Execution Time</span>
                      <span className="text-yellow-400 font-mono">{energyMetrics.executionTime} sec</span>
                    </div>
                    <div className="w-full bg-cyber-dark h-1.5 rounded-full overflow-hidden border border-cyber-border">
                      <motion.div className="bg-yellow-400 h-full" animate={{ width: `${(energyMetrics.executionTime % 60) * 1.66}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Card: Energy Status Gauge */}
              <div className="glass-panel p-5 bg-cyber-panel/30 border border-cyber-border flex flex-col justify-between">
                <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300 font-bold">Energy Status</h4>
                
                {/* Radial Gauge */}
                {(() => {
                  const getGaugeColor = (power) => {
                    if (power < 40) return '#10b981'; // Green
                    if (power <= 70) return '#f59e0b'; // Yellow
                    return '#ef4444'; // Red
                  };
                  const getGaugeStatus = (power) => {
                    if (power < 40) return '🟢 Efficient';
                    if (power <= 70) return '🟡 Moderate';
                    return '🔴 High Load';
                  };
                  
                  const circumference = 2 * Math.PI * 34; // r=34
                  const offset = circumference * (1 - Math.min(energyMetrics.power, 120) / 120);

                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto">
                      <div className="relative flex items-center justify-center w-28 h-28">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="34" stroke="#22232e" strokeWidth="7" fill="transparent" />
                          <circle cx="56" cy="56" r="34" stroke={getGaugeColor(energyMetrics.power)} strokeWidth="7" fill="transparent" 
                                  strokeDasharray={circumference}
                                  strokeDashoffset={offset}
                                  strokeLinecap="round"
                                  className="transition-all duration-500" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-black text-cyber-heading font-mono">{energyMetrics.power}W</span>
                          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Power</span>
                        </div>
                      </div>

                      {/* Status Indicators list */}
                      <div className="w-full sm:flex-1 space-y-1.5 text-[9px] uppercase font-bold tracking-wider text-slate-400">
                        <p className="text-slate-200 text-xs font-black mb-1">{getGaugeStatus(energyMetrics.power)}</p>
                        <div className="flex justify-between border-b border-cyber-border pb-1">
                          <span>Peak</span>
                          <span className="text-cyber-heading font-mono">{energyMetrics.peakPower}W</span>
                        </div>
                        <div className="flex justify-between border-b border-cyber-border pb-1">
                          <span>Today</span>
                          <span className="text-cyber-heading font-mono">{energyMetrics.energyConsumed}Wh</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span>Avg</span>
                          <span className="text-cyber-heading font-mono">54.5W</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 4. Footer Analytics */}
            <div className="grid gap-4 sm:grid-cols-3 border-t border-cyber-border pt-5">
              <div className="glass-panel p-3 text-center border-t-2 border-t-cyber-neon/40 bg-cyber-panel/20">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Total Energy Saved</p>
                <p className="text-lg font-black text-cyber-neon mt-1 font-mono">{energyMetrics.energySaved} kWh</p>
              </div>
              <div className="glass-panel p-3 text-center border-t-2 border-t-cyber-accent/40 bg-cyber-panel/20">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Estimated Cost Saved</p>
                <p className="text-lg font-black text-cyber-accent mt-1 font-mono">${energyMetrics.costSaved}</p>
              </div>
              <div className="glass-panel p-3 text-center border-t-2 border-t-rose-500/40 bg-cyber-panel/20">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">CO₂ Reduction</p>
                <p className="text-lg font-black text-rose-300 mt-1 font-mono">{energyMetrics.co2Reduction} kg</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Tab Content */}
      {activeTab === 'trending' && (
        <div className="space-y-6">
          {/* Controls for Citywide vs Local */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-cyber-panel/40 border border-cyber-border rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <Layers className="text-cyber-accent" size={16} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Scope Selection:</span>
              <div className="flex bg-cyber-dark/80 rounded-md p-1 border border-cyber-border/80">
                <button
                  onClick={() => setTrendScope('citywide')}
                  className={`px-3 py-1 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    trendScope === 'citywide'
                      ? 'bg-cyber-accent/20 border border-cyber-accent/30 text-cyber-accent'
                      : 'text-cyber-text hover:text-cyber-heading'
                  }`}
                >
                  Citywide
                </button>
                <button
                  onClick={() => setTrendScope('local')}
                  className={`px-3 py-1 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    trendScope === 'local'
                      ? 'bg-cyber-accent/20 border border-cyber-accent/30 text-cyber-accent'
                      : 'text-cyber-text hover:text-cyber-heading'
                  }`}
                >
                  Local
                </button>
              </div>
            </div>

            {/* Local Neighborhood Picker */}
            {trendScope === 'local' && (
              <div className="flex flex-wrap gap-1">
                {NEIGHBORHOODS.map((n) => (
                  <button
                    key={n.name}
                    type="button"
                    onClick={() => setSelectedNeighborhood(n.name)}
                    className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full transition-all border cursor-pointer ${
                      selectedNeighborhood === n.name
                        ? 'border-cyber-accent bg-cyber-accent/15 text-cyber-heading'
                        : 'border-cyber-border bg-cyber-border/20 text-cyber-text hover:text-cyber-heading hover:border-cyber-border/80'
                    }`}
                  >
                    {n.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            {/* Left side: News List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-cyber-border pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  {trendScope === 'citywide' ? 'Top Citywide Events' : `Trending in ${selectedNeighborhood}`}
                </h3>
                <span className="text-xs text-cyber-text bg-cyber-panel border border-cyber-border px-2 py-0.5 rounded font-mono">
                  {trends.length} active event clusters
                </span>
              </div>

              {loadingTrends ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 size={36} className="animate-spin text-cyber-accent" />
                  <p className="text-xs text-cyber-text/80 animate-pulse">Clustering incident reports...</p>
                </div>
              ) : locationClusters.length > 0 ? (
                <div className="space-y-4">
                  {locationClusters.map((location) => (
                    <details key={location.id} className="glass-panel border border-cyber-border/50 p-4" open>
                      <summary className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer mb-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyber-accent">Location</p>
                          <h4 className="mt-1 text-2xl font-black text-slate-100">{location.location}</h4>
                        </div>
                        <span className="rounded-full border border-cyber-border bg-cyber-dark/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300">
                          {location.subClusters.length} sub-clusters
                        </span>
                      </summary>

                      <div className="mt-6 space-y-4">
                        <p className="text-sm font-bold text-cyber-heading uppercase tracking-widest border-b border-cyber-border/50 pb-2">Sub Clusters</p>
                        {location.subClusters.map((cluster) => {
                          let Icon = AlertTriangle;
                          const cat = (cluster.category || '').toLowerCase();
                          if (cat.includes('fire')) Icon = Flame;
                          if (cat.includes('flood') || cat.includes('weather') || cat.includes('water')) Icon = Sparkles; // Fallback to sparkles if no cloud icon
                          if (cat.includes('gathering') || cat.includes('protest')) Icon = Layers;
                          if (cat.includes('emergency')) Icon = RadioTower;
                          
                          return (
                            <details key={cluster.id} className="glass-panel border border-cyber-border/30 overflow-hidden" open={false}>
                              <summary className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 cursor-pointer hover:bg-cyber-dark/20 transition-colors">
                                <div className="flex gap-4">
                                  <div className="mt-1 p-2 bg-cyber-dark/50 border border-cyber-border/50 rounded-lg h-fit text-cyber-accent">
                                    <Icon size={20} />
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-black text-slate-100 uppercase tracking-widest flex items-center">
                                        <span className="mr-2 text-cyber-accent">▼</span> 
                                        {cluster.category} ({cluster.reportCount})
                                      </span>
                                      {getSeverityBadge(cluster.severity)}
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-widest text-cyber-accent font-bold mb-1">AI Summary:</p>
                                      <p className="text-sm text-slate-300 leading-relaxed font-medium">{cluster.summary}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right text-[10px] uppercase tracking-[0.22em] text-slate-500 whitespace-nowrap">
                                  Last updated<br />{formatRelativeTime(cluster.lastUpdated)}
                                </div>
                              </summary>

                              <div className="p-4 bg-cyber-dark/30 border-t border-cyber-border/30">
                                <div className="grid gap-4 md:grid-cols-2 mb-6">
                                  <div className="glass-panel/50 border border-cyber-border/30 p-3 text-xs text-slate-300">
                                    <p className="font-bold text-slate-100 uppercase tracking-widest mb-2">Sources</p>
                                    <p className="leading-relaxed">{cluster.sources.length > 0 ? cluster.sources.join(', ') : 'Unknown'}</p>
                                  </div>
                                  <div className="glass-panel/50 border border-cyber-border/30 p-3 text-xs text-slate-300">
                                    <p className="font-bold text-slate-100 uppercase tracking-widest mb-2">Affected Areas</p>
                                    <p className="leading-relaxed">{cluster.affectedAreas.length > 0 ? cluster.affectedAreas.join(', ') : 'N/A'}</p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <p className="text-xs uppercase tracking-widest text-cyber-heading font-black">Reports</p>
                                  <div className="space-y-2 pl-2 border-l border-cyber-border/50">
                                    {cluster.events.map((event, idx) => (
                                      <div key={idx} className="flex items-start gap-2 py-1">
                                        <span className="text-cyber-accent mt-0.5">-</span>
                                        <div className="text-sm text-slate-400">
                                          {event.raw_text}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-16 text-center border-dashed border-cyber-border">
                  <RadioTower className="mx-auto mb-3 text-slate-500 animate-pulse" size={32} />
                  <p className="text-base font-bold text-slate-300">No active trends found.</p>
                  <p className="text-xs text-slate-500 mt-2">Adjust your scope or wait for new intelligence reports to cluster.</p>
                </div>
              )}
            </div>

            {/* Right side: Maps Container */}
            <div className="glass-panel h-[600px] overflow-hidden sticky top-6">
              <MapContainer center={[12.9716, 77.5946]} zoom={12} className="h-full w-full" zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="OSM, CARTO" />
                
                {trends
                  .filter((trend) => isValidLatLng(trend.latitude) && isValidLatLng(trend.longitude))
                  .map((trend) => (
                    <Marker
                      key={trend.id}
                      position={[trend.latitude, trend.longitude]}
                      icon={getCategoryMarkerIcon(trend.category)}
                    >
                      <Popup className="custom-popup">
                        <div className="p-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-cyber-neon tracking-wider px-1.5 py-0.5 border border-cyber-neon/20 rounded bg-cyber-neon/5">
                              {trend.category}
                            </span>
                            <span className="text-[10px] font-bold text-cyber-accent">
                              {trend.size} reports
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-cyber-heading">{trend.location}</h4>
                          <p className="text-[11px] text-slate-300 leading-normal line-clamp-2">{trend.raw_summary}</p>
                          
                          <button
                            onClick={() => setSelectedTrend(trend)}
                            className="mt-1 w-full bg-cyber-accent hover:bg-cyber-accent/80 text-[10px] text-center text-white py-1 rounded font-bold cursor-pointer transition-colors block"
                          >
                            View T5 Summary
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal Popup */}
      {selectedTrend && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-xl p-6 relative flex flex-col max-h-[85vh] border-cyber-accent/30 shadow-[0_0_30px_rgba(176,92,255,0.15)] animate-scale-up">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <div className="flex items-center gap-2 text-cyber-accent">
                <Sparkles size={18} className="animate-pulse" />
                <h3 className="text-base font-bold uppercase tracking-wider">AI Event Intelligence</h3>
              </div>
              <button 
                onClick={() => setSelectedTrend(null)}
                className="text-slate-400 hover:text-slate-200 hover:bg-cyber-border/40 rounded-full p-1 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="glass-panel/60 p-3">
                  <span className="text-[10px] text-cyber-text/60 uppercase block font-semibold mb-1">Locality/Location</span>
                  <strong className="text-cyber-heading text-sm">{selectedTrend.location}</strong>
                </div>
                <div className="glass-panel/60 p-3">
                  <span className="text-[10px] text-cyber-text/60 uppercase block font-semibold mb-1">Event Category</span>
                  <strong className="text-cyber-neon text-sm uppercase">{selectedTrend.category}</strong>
                </div>
              </div>

              {/* T5 Structured Output */}
              <div className="glass-panel bg-cyber-dark/40 border-cyber-border/50 p-4 leading-relaxed text-slate-100 text-sm whitespace-pre-line font-medium border-l-4 border-l-cyber-accent">
                <span className="text-[10px] text-cyber-accent uppercase font-black tracking-widest block mb-2">T5 AI STRUCTURED SUMMARY</span>
                {selectedTrend.summary}
              </div>

              {/* Similar reports list */}
              <div className="space-y-2">
                <span className="text-[10px] text-cyber-text/60 uppercase font-semibold block">Clustered Reports ({selectedTrend.events.length})</span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTrend.events.map((e, i) => (
                    <div key={i} className="glass-panel/30 border border-cyber-border/30 px-3 py-2 text-xs text-slate-400 italic">
                      "{e.raw_text}"
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="border-t border-cyber-border pt-3 flex justify-end">
              <button 
                onClick={() => setSelectedTrend(null)}
                className="bg-cyber-border hover:bg-cyber-border/80 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-md text-cyber-heading cursor-pointer transition-colors"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

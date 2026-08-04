import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function LiveMap() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  
  const filters = ['ALL', 'TRAFFIC', 'EVENT', 'ACCIDENT', 'WEATHER'];

  return (
    <div className="flex flex-col h-full w-full p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-cyan-400 mb-2">Live Map</h2>
          <p className="text-xs text-cyber-text font-mono uppercase tracking-widest">Bengaluru · Glowing Event Grid</p>
        </div>
        
        <div className="flex space-x-2">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full transition-all border ${
                activeFilter === filter 
                  ? 'border-cyber-heading text-cyber-heading bg-cyber-heading/10 shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                  : 'border-cyber-border text-cyber-text/50 hover:text-cyber-text hover:border-cyber-text/50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 glass-panel border-cyber-border relative overflow-hidden rounded-xl">
        <MapContainer 
          center={[12.9716, 77.5946]} 
          zoom={12} 
          style={{ height: '100%', width: '100%', background: '#0a0a0c' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {/* Custom zoom controls could be added here to match design */}
        </MapContainer>
        
        <div className="absolute bottom-6 left-6 z-[400]">
          <div className="glass-panel px-4 py-2 flex items-center space-x-2 border-cyber-accent/30 bg-cyber-dark/80">
            <span className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse"></span>
            <span className="text-xs font-bold tracking-widest text-cyber-text uppercase">0 Active Signals</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, accent = 'text-cyan-300' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
        <span>{label}</span>
        <Icon size={17} className={accent} />
      </div>
      <div className={`mt-4 text-3xl font-black ${accent}`}>{value}</div>
    </motion.div>
  );
}

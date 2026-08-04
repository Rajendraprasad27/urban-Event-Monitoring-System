export default function LoadingSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="glass-panel h-24 animate-pulse bg-slate-800/50" />
      ))}
    </div>
  );
}

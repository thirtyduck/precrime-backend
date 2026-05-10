import { Globe, Server, Activity } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import type { Threat } from '@/types/threat';
import type { DataSourceConfig } from '@/services/threatDataService';

interface GlobalMonitorProps {
  threats: Threat[];
  dataSources: DataSourceConfig[];
}

export function GlobalMonitor({ threats, dataSources }: GlobalMonitorProps) {
  const [pulseRadius, setPulseRadius] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseRadius(prev => (prev + 2) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const geoThreats = useMemo(() =>
    threats
      .filter(t => t.latitude != null && t.longitude != null)
      .map(t => ({
        x: ((t.longitude! + 180) / 360) * 100,
        y: ((90 - t.latitude!) / 180) * 100,
        severity: t.severity,
        label: t.location?.split(',')[0]?.trim().substring(0, 12) || t.source || '',
        title: t.title,
        source: t.source || 'unknown',
        category: t.category,
      })),
    [threats]
  );

  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    threats.forEach(t => { counts[t.severity]++; });
    return counts;
  }, [threats]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    threats.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [threats]);

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    threats.forEach(t => {
      const src = t.source || 'unknown';
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [threats]);

  const connectedSources = dataSources.filter(ds => ds.status === 'connected').length;
  const enabledSources = dataSources.filter(ds => ds.enabled).length;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-cyan-400" />
        <h2 className="font-orbitron text-lg font-semibold text-white tracking-wide">
          GLOBAL THREAT MONITOR
        </h2>
        <span className="text-[10px] text-cyan-400/50 ml-2">
          {geoThreats.length} geo-located / {threats.length} total threats
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* World Map Projection */}
        <div className="lg:col-span-2 cyber-card p-6 relative overflow-hidden">
          <div className="absolute inset-0 hexagon-pattern opacity-30" />

          <div className="relative h-80">
            {/* Equirectangular map grid */}
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid lines */}
              {[20, 40, 50, 60, 80].map(y => (
                <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="rgba(0,255,255,0.08)" strokeWidth="0.2" />
              ))}
              {[20, 40, 60, 80].map(x => (
                <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="rgba(0,255,255,0.08)" strokeWidth="0.2" />
              ))}
              {/* Equator */}
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0,255,255,0.15)" strokeWidth="0.3" strokeDasharray="1,1" />
              {/* Prime meridian */}
              <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0,255,255,0.15)" strokeWidth="0.3" strokeDasharray="1,1" />

              {/* Rough continent outlines — simplified polygons */}
              <ContinentOutlines />

              {/* Radar sweep overlay */}
              <defs>
                <radialGradient id="sweep" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(0,255,255,0.1)" />
                  <stop offset="100%" stopColor="rgba(0,255,255,0)" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r={pulseRadius / 2 + 5} fill="none" stroke="rgba(0,255,255,0.15)" strokeWidth="0.3"
                opacity={1 - pulseRadius / 100} />

              {/* Threat points */}
              {geoThreats.map((t, i) => (
                <g key={i}>
                  <circle
                    cx={t.x} cy={t.y}
                    r={t.severity === 'critical' ? 1.2 : t.severity === 'high' ? 1 : 0.7}
                    fill={severityColor(t.severity)}
                    opacity={0.9}
                  >
                    <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle
                    cx={t.x} cy={t.y}
                    r={t.severity === 'critical' ? 2.5 : 1.8}
                    fill="none"
                    stroke={severityColor(t.severity)}
                    strokeWidth="0.2"
                    opacity={0.4}
                  >
                    <animate attributeName="r" values={`${t.severity === 'critical' ? 1.2 : 1};${t.severity === 'critical' ? 3.5 : 2.5}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite" />
                  </circle>
                </g>
              ))}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 flex items-center gap-3">
              {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
                <div key={sev} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColor(sev) }} />
                  <span className="text-[9px] text-cyan-400/50 capitalize">{sev}</span>
                </div>
              ))}
            </div>

            <div className="absolute bottom-2 right-2 text-right">
              <p className="text-[10px] text-cyan-400/40">SCAN RANGE</p>
              <p className="font-orbitron text-lg text-cyan-400">GLOBAL</p>
            </div>
          </div>
        </div>

        {/* Side Panel — real stats */}
        <div className="space-y-4">
          {/* Severity Breakdown */}
          <div className="cyber-card p-4">
            <h3 className="font-orbitron text-sm text-cyan-400 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              THREAT SEVERITY
            </h3>
            <div className="space-y-2">
              <SeverityBar label="Critical" count={severityCounts.critical} total={threats.length} color="#ef4444" />
              <SeverityBar label="High" count={severityCounts.high} total={threats.length} color="#f59e0b" />
              <SeverityBar label="Medium" count={severityCounts.medium} total={threats.length} color="#06b6d4" />
              <SeverityBar label="Low" count={severityCounts.low} total={threats.length} color="#10b981" />
            </div>
          </div>

          {/* Categories */}
          <div className="cyber-card p-4">
            <h3 className="font-orbitron text-sm text-cyan-400 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              BY CATEGORY
            </h3>
            <div className="space-y-2">
              {categoryCounts.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-xs text-cyan-400/70 truncate mr-2">{cat}</span>
                  <span className="font-orbitron text-sm text-cyan-400">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Source Status */}
          <div className="cyber-card p-4">
            <h3 className="font-orbitron text-sm text-cyan-400 mb-3 flex items-center gap-2">
              <Server className="w-4 h-4" />
              SOURCES ({connectedSources}/{enabledSources})
            </h3>
            <div className="space-y-2">
              {sourceCounts.map(([src, count]) => {
                const ds = dataSources.find(d => d.id === src);
                const statusColor = ds?.status === 'connected' ? 'bg-emerald-400' : ds?.status === 'demo' ? 'bg-purple-400' : 'bg-amber-400';
                return (
                  <div key={src} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
                    <span className="text-xs text-cyan-400/70 flex-1 truncate">{ds?.name || src}</span>
                    <span className="font-orbitron text-[10px] text-cyan-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'medium': return '#06b6d4';
    case 'low': return '#10b981';
    default: return '#06b6d4';
  }
}

function SeverityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-cyan-400/70 w-14">{label}</span>
      <div className="flex-1 h-1.5 bg-cyber-dark rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-orbitron text-[10px] text-cyan-400 w-6 text-right">{count}</span>
    </div>
  );
}

function ContinentOutlines() {
  return (
    <g stroke="rgba(0,255,255,0.12)" strokeWidth="0.3" fill="rgba(0,255,255,0.03)">
      {/* North America */}
      <polygon points="5,18 18,15 25,20 28,25 25,35 22,40 18,42 15,38 12,35 8,30 5,25" />
      {/* South America */}
      <polygon points="22,48 27,45 30,50 32,55 30,65 28,72 25,78 22,75 20,65 20,55" />
      {/* Europe */}
      <polygon points="47,18 55,16 58,20 55,25 52,28 48,27 46,24" />
      {/* Africa */}
      <polygon points="47,32 55,30 60,35 62,45 58,58 55,65 50,62 47,52 45,42" />
      {/* Asia */}
      <polygon points="58,15 72,12 82,18 85,25 80,35 75,38 70,35 65,30 60,25" />
      {/* India */}
      <polygon points="65,32 70,30 72,35 70,42 67,40 65,36" />
      {/* Southeast Asia / Indonesia */}
      <polygon points="75,40 82,38 85,42 82,48 78,45" />
      {/* Australia */}
      <polygon points="78,58 88,55 92,60 90,68 82,68 78,63" />
    </g>
  );
}

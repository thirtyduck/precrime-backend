import { Globe, Radio, Satellite, Wifi, Server, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

export function GlobalMonitor() {
  const [rotation, setRotation] = useState(0);
  const [pulseRadius, setPulseRadius] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360);
      setPulseRadius(prev => (prev + 2) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Generate random threat points on the globe
  const threatPoints = [
    { x: 30, y: 35, type: 'critical', label: 'NYC' },
    { x: 52, y: 28, type: 'high', label: 'LON' },
    { x: 75, y: 40, type: 'medium', label: 'TYO' },
    { x: 45, y: 55, type: 'high', label: 'DXB' },
    { x: 65, y: 65, type: 'critical', label: 'SIN' },
    { x: 20, y: 50, type: 'medium', label: 'LAX' },
    { x: 48, y: 22, type: 'low', label: 'BER' },
    { x: 80, y: 55, type: 'medium', label: 'SYD' },
  ];

  const dataStreams = [
    { name: 'Network Traffic', value: 847.3, unit: 'Gbps', trend: 'up' },
    { name: 'Active Connections', value: 2.4, unit: 'M', trend: 'stable' },
    { name: 'Threat Feeds', value: 156, unit: '', trend: 'up' },
    { name: 'Data Points', value: 8.7, unit: 'B', trend: 'up' },
  ];

  const systemNodes = [
    { name: 'Core AI', status: 'online', load: 87 },
    { name: 'Analytics', status: 'online', load: 72 },
    { name: 'Prediction', status: 'online', load: 91 },
    { name: 'Storage', status: 'online', load: 45 },
  ];

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-cyan-400" />
        <h2 className="font-orbitron text-lg font-semibold text-white tracking-wide">
          GLOBAL THREAT MONITOR
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radar Globe */}
        <div className="lg:col-span-2 cyber-card p-6 relative overflow-hidden">
          <div className="absolute inset-0 hexagon-pattern opacity-30" />
          
          <div className="relative flex items-center justify-center h-80">
            {/* Globe Circle */}
            <div className="relative w-64 h-64">
              {/* Outer rings */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
              <div className="absolute inset-4 rounded-full border border-cyan-500/15" />
              <div className="absolute inset-8 rounded-full border border-cyan-500/10" />
              
              {/* Grid lines */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/10" 
                style={{ transform: `rotate(${rotation}deg)` }} 
              />
              <div className="absolute inset-12 rounded-full border border-dashed border-cyan-500/10" 
                style={{ transform: `rotate(-${rotation}deg)` }} 
              />

              {/* Radar sweep */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                  background: `conic-gradient(from ${rotation}deg, transparent 0deg, rgba(0, 255, 255, 0.1) 60deg, transparent 120deg)`,
                }}
              />

              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse shadow-cyan" />
              </div>

              {/* Threat points */}
              {threatPoints.map((point, i) => (
                <ThreatPoint key={i} point={point} />
              ))}

              {/* Pulse effect */}
              <div 
                className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
                style={{ 
                  transform: `scale(${0.5 + pulseRadius / 200})`,
                  opacity: 1 - pulseRadius / 100,
                }}
              />
            </div>

            {/* Side indicators */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-2">
              <Indicator icon={Radio} label="SIGINT" active />
              <Indicator icon={Satellite} label="SAT" active />
              <Indicator icon={Wifi} label="NET" active />
            </div>

            {/* Range rings labels */}
            <div className="absolute bottom-4 right-4 text-right">
              <p className="text-[10px] text-cyan-400/40">SCAN RANGE</p>
              <p className="font-orbitron text-lg text-cyan-400">GLOBAL</p>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Data Streams */}
          <div className="cyber-card p-4">
            <h3 className="font-orbitron text-sm text-cyan-400 mb-4 flex items-center gap-2">
              <Server className="w-4 h-4" />
              DATA STREAMS
            </h3>
            <div className="space-y-3">
              {dataStreams.map((stream, i) => (
                <DataStreamItem key={i} stream={stream} />
              ))}
            </div>
          </div>

          {/* System Nodes */}
          <div className="cyber-card p-4">
            <h3 className="font-orbitron text-sm text-cyan-400 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              SYSTEM NODES
            </h3>
            <div className="space-y-2">
              {systemNodes.map((node, i) => (
                <SystemNode key={i} node={node} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ThreatPointProps {
  point: { x: number; y: number; type: string; label: string };
}

function ThreatPoint({ point }: ThreatPointProps) {
  const colors = {
    critical: 'bg-red-400 shadow-red',
    high: 'bg-amber-400 shadow-amber',
    medium: 'bg-cyan-400 shadow-cyan',
    low: 'bg-emerald-400 shadow-emerald',
  };

  const colorClass = colors[point.type as keyof typeof colors] || colors.medium;

  return (
    <div 
      className="absolute"
      style={{ 
        left: `${point.x}%`, 
        top: `${point.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className={`w-2 h-2 rounded-full ${colorClass} animate-pulse`} />
      <div className={`absolute inset-0 w-2 h-2 rounded-full ${colorClass} animate-ping opacity-50`} />
      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-cyan-400/60 whitespace-nowrap">
        {point.label}
      </span>
    </div>
  );
}

interface IndicatorProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
}

function Indicator({ icon: Icon, label, active }: IndicatorProps) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded ${active ? 'bg-cyan-500/10' : 'bg-cyber-dark/50'}`}>
      <Icon className={`w-3 h-3 ${active ? 'text-cyan-400' : 'text-cyan-400/30'}`} />
      <span className={`text-[10px] ${active ? 'text-cyan-400' : 'text-cyan-400/30'}`}>{label}</span>
    </div>
  );
}

interface DataStreamItemProps {
  stream: { name: string; value: number; unit: string; trend: string };
}

function DataStreamItem({ stream }: DataStreamItemProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-cyan-400/70">{stream.name}</span>
      <div className="flex items-center gap-2">
        <span className="font-orbitron text-sm text-cyan-400">
          {stream.value}{stream.unit}
        </span>
        <span className={`text-[10px] ${
          stream.trend === 'up' ? 'text-red-400' : 
          stream.trend === 'down' ? 'text-emerald-400' : 
          'text-cyan-400'
        }`}>
          {stream.trend === 'up' ? '↗' : stream.trend === 'down' ? '↘' : '→'}
        </span>
      </div>
    </div>
  );
}

interface SystemNodeProps {
  node: { name: string; status: string; load: number };
}

function SystemNode({ node }: SystemNodeProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${node.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
      <span className="text-xs text-cyan-400/70 flex-1">{node.name}</span>
      <div className="w-16 h-1 bg-cyber-dark rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${
            node.load > 80 ? 'bg-red-400' : 
            node.load > 60 ? 'bg-amber-400' : 
            'bg-emerald-400'
          }`}
          style={{ width: `${node.load}%` }}
        />
      </div>
      <span className="font-orbitron text-[10px] text-cyan-400 w-8 text-right">{node.load}%</span>
    </div>
  );
}

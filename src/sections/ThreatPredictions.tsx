import { AlertTriangle, Clock, MapPin, Target, X, Shield, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Threat } from '@/types/threat';

interface ThreatPredictionsProps {
  threats: Threat[];
  onDismiss: (id: string) => void;
}

export function ThreatPredictions({ threats, onDismiss }: ThreatPredictionsProps) {
  const criticalThreats = threats.filter(t => t.severity === 'critical');
  const highThreats = threats.filter(t => t.severity === 'high');
  const mediumThreats = threats.filter(t => t.severity === 'medium');

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-cyan-400" />
          <h2 className="font-orbitron text-lg font-semibold text-white tracking-wide">
            PREDICTIVE THREAT ANALYSIS
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <ThreatCounter count={criticalThreats.length} label="Critical" color="red" />
          <ThreatCounter count={highThreats.length} label="High" color="amber" />
          <ThreatCounter count={mediumThreats.length} label="Medium" color="cyan" />
        </div>
      </div>

      {/* Threat Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {threats.map((threat, index) => (
          <ThreatCard 
            key={threat.id} 
            threat={threat} 
            onDismiss={onDismiss}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

interface ThreatCounterProps {
  count: number;
  label: string;
  color: 'red' | 'amber' | 'cyan';
}

function ThreatCounter({ count, label, color }: ThreatCounterProps) {
  const colorClasses = {
    red: 'text-red-400 border-red-500/30 bg-red-500/10',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded border ${colorClasses[color]}`}>
      <span className="font-orbitron text-lg font-bold">{count}</span>
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </div>
  );
}

interface ThreatCardProps {
  threat: Threat;
  onDismiss: (id: string) => void;
  index: number;
}

function ThreatCard({ threat, onDismiss, index }: ThreatCardProps) {
  const severityConfig = {
    critical: {
      border: 'border-red-500/50',
      bg: 'bg-red-500/5',
      glow: 'shadow-red',
      badge: 'bg-red-500/20 text-red-400 border-red-500/50',
      icon: AlertTriangle,
    },
    high: {
      border: 'border-amber-500/50',
      bg: 'bg-amber-500/5',
      glow: 'shadow-amber',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
      icon: AlertTriangle,
    },
    medium: {
      border: 'border-cyan-500/50',
      bg: 'bg-cyan-500/5',
      glow: 'shadow-cyan',
      badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      icon: Shield,
    },
    low: {
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-500/5',
      glow: 'shadow-emerald',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      icon: Shield,
    },
  };

  const config = severityConfig[threat.severity];
  const Icon = config.icon;

  return (
    <div 
      className={`cyber-card ${config.border} ${config.bg} p-4 relative overflow-hidden group`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Scan line effect */}
      <div className="scan-line opacity-30" />
      
      {/* Corner accents */}
      <div className={`corner-accent corner-accent-tl ${config.border.replace('border', 'border')}`} />
      <div className={`corner-accent corner-accent-tr ${config.border.replace('border', 'border')}`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${threat.severity === 'critical' ? 'text-red-400 animate-pulse' : threat.severity === 'high' ? 'text-amber-400' : 'text-cyan-400'}`} />
          <span className="font-orbitron text-xs text-cyan-400/60">{threat.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${config.badge} text-xs`}>
            {threat.severity.toUpperCase()}
          </Badge>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10"
            onClick={() => onDismiss(threat.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Title & Description */}
      <h3 className={`font-orbitron text-sm font-semibold mb-2 ${
        threat.severity === 'critical' ? 'text-red-400' : 
        threat.severity === 'high' ? 'text-amber-400' : 'text-cyan-400'
      }`}>
        {threat.title}
      </h3>
      <p className="text-xs text-cyan-400/70 mb-4 line-clamp-2">{threat.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 bg-cyber-dark/50 rounded px-2 py-1.5">
          <Clock className="w-3 h-3 text-cyan-400/60" />
          <div>
            <p className="text-[10px] text-cyan-400/50 uppercase">ETA</p>
            <p className="font-orbitron text-xs text-cyan-400">{threat.predictedTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-cyber-dark/50 rounded px-2 py-1.5">
          <Target className="w-3 h-3 text-cyan-400/60" />
          <div>
            <p className="text-[10px] text-cyan-400/50 uppercase">Confidence</p>
            <p className="font-orbitron text-xs text-cyan-400">{threat.confidence.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-3 h-3 text-cyan-400/60" />
        <span className="text-xs text-cyan-400/70">{threat.location}</span>
      </div>

      {/* Indicators */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-cyan-400/50 uppercase tracking-wider">Threat Indicators</p>
        <div className="flex flex-wrap gap-1">
          {threat.indicators.map((indicator, i) => (
            <span 
              key={i}
              className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400/80 border border-cyan-500/20"
            >
              {indicator}
            </span>
          ))}
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute bottom-2 right-2">
        <div className={`w-2 h-2 rounded-full ${
          threat.status === 'active' ? 'bg-red-400 animate-pulse' : 
          threat.status === 'monitoring' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
        }`} />
      </div>
    </div>
  );
}

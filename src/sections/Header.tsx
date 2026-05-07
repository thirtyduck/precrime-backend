import { Activity, Database, Clock, Shield, Zap } from 'lucide-react';
import type { SystemStatus } from '@/types/threat';

interface HeaderProps {
  systemStatus: SystemStatus;
}

export function Header({ systemStatus }: HeaderProps) {
  return (
    <header className="relative w-full border-b border-cyan-500/30 bg-cyber-dark/90 backdrop-blur-md">
      {/* Top scan line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="font-orbitron text-2xl font-bold text-cyan-400 tracking-wider">
                PRE<span className="text-white">CRIME</span>
              </h1>
              <p className="text-xs text-cyan-400/60 tracking-[0.3em] uppercase">
                Threat Intelligence System
              </p>
            </div>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-8">
            <StatusItem 
              icon={Activity} 
              label="System Status" 
              value={systemStatus.online ? 'ONLINE' : 'OFFLINE'}
              status={systemStatus.online ? 'good' : 'bad'}
            />
            <StatusItem 
              icon={Database} 
              label="Data Sources" 
              value={systemStatus.dataSources.toString()}
              status="good"
            />
            <StatusItem 
              icon={Zap} 
              label="Accuracy" 
              value={`${systemStatus.predictionAccuracy}%`}
              status="good"
            />
            <StatusItem 
              icon={Clock} 
              label="Last Update" 
              value={systemStatus.lastUpdate}
              status="neutral"
            />
          </div>
        </div>
      </div>

      {/* Decorative corner accents */}
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-500/50" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-500/50" />
    </header>
  );
}

interface StatusItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  status: 'good' | 'bad' | 'neutral';
}

function StatusItem({ icon: Icon, label, value, status }: StatusItemProps) {
  const statusColors = {
    good: 'text-emerald-400',
    bad: 'text-red-400',
    neutral: 'text-cyan-400',
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${statusColors[status]}`} />
      <div className="flex flex-col">
        <span className="text-[10px] text-cyan-400/60 uppercase tracking-wider">{label}</span>
        <span className={`font-orbitron text-sm font-semibold ${statusColors[status]}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

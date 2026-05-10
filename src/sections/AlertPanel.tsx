import { Bell, Check, AlertTriangle, Info, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import type { Alert } from '@/types/threat';

interface AlertPanelProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
}

export function AlertPanel({ alerts, onAcknowledge }: AlertPanelProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  return (
    <section className="cyber-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-cyan-400" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{activeAlerts.length}</span>
              </span>
            )}
          </div>
          <h2 className="font-orbitron text-lg font-semibold text-white tracking-wide">
            ACTIVE ALERTS
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Alert List */}
      <ScrollArea className="flex-1 min-h-0 p-4">
        <div className="space-y-3">
          {activeAlerts.length === 0 && acknowledgedAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-cyan-400/20 mx-auto mb-3" />
              <p className="text-cyan-400/50 text-sm">No active alerts</p>
              <p className="text-cyan-400/30 text-xs mt-1">System operating normally</p>
            </div>
          ) : (
            <>
              {/* Active Alerts */}
              {activeAlerts.map((alert) => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert} 
                  onAcknowledge={onAcknowledge}
                  active
                />
              ))}
              
              {/* Acknowledged Alerts */}
              {acknowledgedAlerts.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-4 pb-2">
                    <div className="flex-1 h-px bg-cyan-500/20" />
                    <span className="text-[10px] text-cyan-400/40 uppercase tracking-wider">Acknowledged</span>
                    <div className="flex-1 h-px bg-cyan-500/20" />
                  </div>
                  {acknowledgedAlerts.map((alert) => (
                    <AlertItem 
                      key={alert.id} 
                      alert={alert} 
                      onAcknowledge={onAcknowledge}
                      active={false}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-4 border-t border-cyan-500/20 bg-cyber-dark/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-orbitron text-xl font-bold text-red-400">
              {alerts.filter(a => a.type === 'critical' && !a.acknowledged).length}
            </p>
            <p className="text-[10px] text-cyan-400/50 uppercase">Critical</p>
          </div>
          <div>
            <p className="font-orbitron text-xl font-bold text-amber-400">
              {alerts.filter(a => a.type === 'warning' && !a.acknowledged).length}
            </p>
            <p className="text-[10px] text-cyan-400/50 uppercase">Warnings</p>
          </div>
          <div>
            <p className="font-orbitron text-xl font-bold text-cyan-400">
              {alerts.filter(a => a.type === 'info' && !a.acknowledged).length}
            </p>
            <p className="text-[10px] text-cyan-400/50 uppercase">Info</p>
          </div>
        </div>
      </div>
    </section>
  );
}

interface AlertItemProps {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  active: boolean;
}

function AlertItem({ alert, onAcknowledge, active }: AlertItemProps) {
  const typeConfig = {
    critical: {
      icon: AlertTriangle,
      border: 'border-red-500/50',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      glow: 'shadow-red',
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-500/50',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      glow: 'shadow-amber',
    },
    info: {
      icon: Info,
      border: 'border-cyan-500/50',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      glow: 'shadow-cyan',
    },
  };

  const config = typeConfig[alert.type];
  const Icon = config.icon;

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div 
      className={`relative p-3 rounded border ${config.border} ${config.bg} ${active ? '' : 'opacity-50'} transition-all duration-300`}
    >
      {/* Pulse effect for active critical alerts */}
      {active && alert.type === 'critical' && (
        <div className="absolute inset-0 rounded border border-red-500/30 animate-pulse" />
      )}

      <div className="relative flex items-start gap-3">
        <Icon className={`w-4 h-4 ${config.text} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${config.text} leading-tight`}>{alert.message}</p>
          <p className="text-[10px] text-cyan-400/50 mt-1">{formatTime(alert.timestamp)}</p>
        </div>
        {active && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10 flex-shrink-0"
            onClick={() => onAcknowledge(alert.id)}
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

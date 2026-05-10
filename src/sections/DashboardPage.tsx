import { Header } from '@/sections/Header';
import { ThreatPredictions } from '@/sections/ThreatPredictions';
import { RiskMetrics } from '@/sections/RiskMetrics';
import { AlertPanel } from '@/sections/AlertPanel';
import { GlobalMonitor } from '@/sections/GlobalMonitor';
import { DataSourcePanel } from '@/sections/DataSourcePanel';
import { useBackendThreatData, type ConnectionMode } from '@/hooks/useBackendThreatData';
import { useAuth } from '@/contexts/AuthContext';
import { Cpu, Eye, Fingerprint, Shield, Database, Radio, Server, AlertTriangle, Edit3, Check, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getCurrentBackendUrl, setBackendUrl as saveBackendUrl } from '@/services/api';

export function DashboardPage() {
  const { username, logout, role, canManageDataSources } = useAuth();
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('auto');
  const {
    threats,
    alerts,
    riskMetrics,
    systemStatus,
    threatCategories,
    dataSources,
    acknowledgeAlert,
    dismissThreat,
    toggleDataSource,
    updateDataSourceApiKey,
    updateDataSourceEndpoint,
    refreshData,
    testDataSource,
    isLoading,
    lastDataFetch,
    backendConnected,
    connectionError,
    activeMode,
  } = useBackendThreatData(connectionMode);

  const realThreatCount = threats.filter(t => t.source && t.source !== 'mock').length;

  return (
    <div className="min-h-screen bg-cyber-dark text-foreground grid-bg">
      <div className="fixed inset-0 hexagon-pattern opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-cyber-dark via-transparent to-cyber-dark pointer-events-none" />

      <Header systemStatus={systemStatus} username={username} onLogout={logout} role={role} />

      <main className="relative container mx-auto px-4 py-6 space-y-6">
        <ConnectionBar
          backendConnected={backendConnected}
          connectionError={connectionError}
          activeMode={activeMode}
          mode={connectionMode}
          onModeChange={setConnectionMode}
          realThreatCount={realThreatCount}
          totalThreats={threats.length}
        />

        <StatsBar
          totalThreats={threats.length}
          activePredictions={threats.filter(t => t.status === 'active').length}
          accuracy={systemStatus.predictionAccuracy}
          uptime={systemStatus.uptime}
        />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <GlobalMonitor threats={threats} dataSources={dataSources} />

            <DataSourcePanel
              dataSources={dataSources}
              onToggle={toggleDataSource}
              onUpdateApiKey={updateDataSourceApiKey}
              onUpdateEndpoint={updateDataSourceEndpoint}
              onRefresh={refreshData}
              onTest={testDataSource}
              isLoading={isLoading}
              lastFetch={lastDataFetch}
              backendConnected={backendConnected}
              canManage={canManageDataSources}
            />

            <ThreatPredictions threats={threats} onDismiss={dismissThreat} />
            <RiskMetrics metrics={riskMetrics} categories={threatCategories} />
          </div>

          <div className="xl:col-span-1">
            <div className="sticky top-6 h-[calc(100vh-8rem)]">
              <AlertPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />
            </div>
          </div>
        </div>
      </main>

      <footer className="relative border-t border-cyan-500/20 bg-cyber-dark/90 backdrop-blur-md mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <FooterItem icon={Shield} label="Security" value="ACTIVE" status="good" />
              <FooterItem icon={Eye} label="Monitoring" value="24/7" status="good" />
              <FooterItem icon={Fingerprint} label="Auth" value="BIOMETRIC" status="good" />
              <FooterItem icon={Cpu} label="AI Core" value="ONLINE" status="good" />
              <FooterItem
                icon={Database}
                label="Data Sources"
                value={`${dataSources.filter(ds => ds.status === 'connected').length}/${dataSources.filter(ds => ds.enabled).length}`}
                status="good"
              />
              <FooterItem
                icon={backendConnected ? Radio : Server}
                label="Backend"
                value={backendConnected ? 'CONNECTED' : 'LOCAL'}
                status={backendConnected ? 'good' : 'neutral'}
              />
            </div>
            <div className="text-right">
              <p className="text-[10px] text-cyan-400/40 uppercase tracking-wider">
                Precrime Threat Intelligence System v2.4.1
              </p>
              <p className="text-[10px] text-cyan-400/30">
                {backendConnected ? 'LIVE MODE - Real Threat Intelligence' : 'LOCAL MODE - Simulated Data'}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface ConnectionBarProps {
  backendConnected: boolean;
  connectionError: string | null;
  activeMode: ConnectionMode;
  mode: ConnectionMode;
  onModeChange: (mode: ConnectionMode) => void;
  realThreatCount: number;
  totalThreats: number;
}

function ConnectionBar({
  backendConnected,
  connectionError,
  activeMode,
  mode,
  onModeChange,
  realThreatCount,
  totalThreats,
}: ConnectionBarProps) {
  const hasError = !backendConnected && activeMode === 'backend';
  const [expanded, setExpanded] = useState(hasError);
  const [backendUrl, setBackendUrl] = useState(getCurrentBackendUrl().replace('/api', ''));
  const [editingUrl, setEditingUrl] = useState(false);
  const autoCollapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hasError) {
      setExpanded(true);
      return;
    }

    setExpanded(true);
    autoCollapseTimer.current = setTimeout(() => setExpanded(false), 5000);
    return () => {
      if (autoCollapseTimer.current) clearTimeout(autoCollapseTimer.current);
    };
  }, [backendConnected, activeMode]);

  const handleExpand = () => {
    setExpanded(true);
    if (autoCollapseTimer.current) clearTimeout(autoCollapseTimer.current);
  };

  const handleSaveUrl = () => {
    saveBackendUrl(backendUrl);
    setEditingUrl(false);
    window.location.reload();
  };

  const statusColor = hasError
    ? 'border-red-500/50 bg-red-500/5'
    : backendConnected
      ? 'border-emerald-500/30 bg-emerald-500/5'
      : 'border-cyan-500/30 bg-cyber-dark/50';

  const StatusIcon = hasError ? AlertTriangle : backendConnected ? Radio : Server;
  const statusIconColor = hasError ? 'text-red-400' : backendConnected ? 'text-emerald-400' : 'text-cyan-400';
  const statusLabel = hasError ? 'Connection Failed' : backendConnected ? 'Connected' : 'Local Mode';
  const statusLabelColor = hasError ? 'text-red-400' : backendConnected ? 'text-emerald-400' : 'text-cyan-400/70';

  return (
    <div className={`cyber-card ${statusColor} transition-all duration-300`}>
      {/* Collapsed / always-visible bar */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => expanded ? setExpanded(false) : handleExpand()}
      >
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-4 h-4 ${statusIconColor}`} />
          <span className={`text-sm font-medium ${statusLabelColor}`}>{statusLabel}</span>
          {hasError && !expanded && (
            <span className="text-xs text-red-400/60">
              {connectionError || 'Unable to connect'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-[10px]">
            {totalThreats} total threats
          </Badge>
          {backendConnected && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-[10px]">
              {realThreatCount} from live feeds
            </Badge>
          )}
          <ChevronDown className={`w-4 h-4 text-cyan-400/40 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded content */}
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-60' : 'max-h-0'}`}>
        <div className="px-3 pb-3 space-y-3 border-t border-cyan-500/10">
          {hasError && (
            <p className="text-red-400/70 text-sm pt-2">
              {connectionError || 'Unable to connect to threat intelligence API'}
            </p>
          )}

          {/* Connection mode buttons */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs text-cyan-400/50">Mode:</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={mode === 'auto' ? 'default' : 'outline'}
                onClick={(e) => { e.stopPropagation(); onModeChange('auto'); }}
                className={`h-7 text-xs ${mode === 'auto' ? 'bg-cyan-500 text-cyber-dark' : 'border-cyan-500/30 text-cyan-400'}`}
              >
                Auto
              </Button>
              <Button
                size="sm"
                variant={mode === 'backend' ? 'default' : 'outline'}
                onClick={(e) => { e.stopPropagation(); onModeChange('backend'); }}
                className={`h-7 text-xs ${mode === 'backend' ? 'bg-cyan-500 text-cyber-dark' : 'border-cyan-500/30 text-cyan-400'}`}
              >
                Backend API
              </Button>
              <Button
                size="sm"
                variant={mode === 'mock' ? 'default' : 'outline'}
                onClick={(e) => { e.stopPropagation(); onModeChange('mock'); }}
                className={`h-7 text-xs ${mode === 'mock' ? 'bg-cyan-500 text-cyber-dark' : 'border-cyan-500/30 text-cyan-400'}`}
              >
                Local Only
              </Button>
            </div>
          </div>

          {/* Backend URL */}
          {(mode === 'backend' || mode === 'auto') && (
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-cyan-400/50">URL:</span>
              {editingUrl ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="http://localhost:3001"
                    className="h-7 text-xs bg-cyber-dark border-cyan-500/30 text-cyan-400 max-w-md"
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/10" onClick={handleSaveUrl}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => setEditingUrl(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <code className="text-xs text-cyan-400 bg-cyber-dark px-2 py-0.5 rounded">
                    {getCurrentBackendUrl()}
                  </code>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-cyan-400/60 hover:text-cyan-400" onClick={() => setEditingUrl(true)}>
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatsBarProps {
  totalThreats: number;
  activePredictions: number;
  accuracy: number;
  uptime: string;
}

function StatsBar({ totalThreats, activePredictions, accuracy, uptime }: StatsBarProps) {
  return (
    <div className="cyber-card p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatItem
          label="Total Threats Detected"
          value={totalThreats.toString()}
          subtext="Last 24 hours"
          color="cyan"
        />
        <StatItem
          label="Active Predictions"
          value={activePredictions.toString()}
          subtext="Real-time monitoring"
          color="amber"
        />
        <StatItem
          label="Prediction Accuracy"
          value={`${accuracy}%`}
          subtext="AI model confidence"
          color="emerald"
        />
        <StatItem
          label="System Uptime"
          value={uptime}
          subtext="Continuous operation"
          color="cyan"
        />
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  subtext: string;
  color: 'cyan' | 'amber' | 'emerald' | 'red';
}

function StatItem({ label, value, subtext, color }: StatItemProps) {
  const colorClasses = {
    cyan: 'text-cyan-400 border-cyan-500/30',
    amber: 'text-amber-400 border-amber-500/30',
    emerald: 'text-emerald-400 border-emerald-500/30',
    red: 'text-red-400 border-red-500/30',
  };

  return (
    <div className={`text-center p-3 rounded border ${colorClasses[color]} bg-cyber-dark/50`}>
      <p className="text-[10px] text-cyan-400/50 uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-orbitron text-2xl font-bold ${colorClasses[color].split(' ')[0]}`}>
        {value}
      </p>
      <p className="text-[10px] text-cyan-400/40">{subtext}</p>
    </div>
  );
}

interface FooterItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  status: 'good' | 'bad' | 'neutral';
}

function FooterItem({ icon: Icon, label, value, status }: FooterItemProps) {
  const statusColors = {
    good: 'text-emerald-400',
    bad: 'text-red-400',
    neutral: 'text-cyan-400',
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${statusColors[status]}`} />
      <div>
        <p className="text-[10px] text-cyan-400/50 uppercase">{label}</p>
        <p className={`font-orbitron text-xs ${statusColors[status]}`}>{value}</p>
      </div>
    </div>
  );
}

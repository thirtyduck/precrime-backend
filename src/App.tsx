import { Header } from '@/sections/Header';
import { ThreatPredictions } from '@/sections/ThreatPredictions';
import { RiskMetrics } from '@/sections/RiskMetrics';
import { AlertPanel } from '@/sections/AlertPanel';
import { GlobalMonitor } from '@/sections/GlobalMonitor';
import { DataSourcePanel } from '@/sections/DataSourcePanel';
import { useBackendThreatData, type ConnectionMode } from '@/hooks/useBackendThreatData';
import { Cpu, Eye, Fingerprint, Shield, Database, Radio, Server, AlertTriangle, Edit3, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getCurrentBackendUrl, setBackendUrl as saveBackendUrl } from '@/services/api';

function App() {
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

  const realThreatCount = threats.filter(t => 
    t.source === 'misp' || 
    t.source === 'levelblue' || 
    t.source === 'shadowserver' ||
    t.source === 'cisa' ||
    t.source === 'openphish'
  ).length;

  return (
    <div className="min-h-screen bg-cyber-dark text-foreground grid-bg">
      {/* Background Effects */}
      <div className="fixed inset-0 hexagon-pattern opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-cyber-dark via-transparent to-cyber-dark pointer-events-none" />

      {/* Header */}
      <Header systemStatus={systemStatus} />

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-6 space-y-6">
        {/* Connection Status Banner */}
        <ConnectionStatusBanner 
          backendConnected={backendConnected}
          connectionError={connectionError}
          activeMode={activeMode}
        />

        {/* Connection Mode Selector */}
        <ConnectionModeSelector 
          mode={connectionMode} 
          onChange={setConnectionMode}
          backendConnected={backendConnected}
          realThreatCount={realThreatCount}
          totalThreats={threats.length}
        />

        {/* Top Stats Bar */}
        <StatsBar 
          totalThreats={threats.length}
          activePredictions={threats.filter(t => t.status === 'active').length}
          accuracy={systemStatus.predictionAccuracy}
          uptime={systemStatus.uptime}
        />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Global Monitor */}
            <GlobalMonitor />

            {/* Data Source Panel */}
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
            />

            {/* Threat Predictions */}
            <ThreatPredictions threats={threats} onDismiss={dismissThreat} />

            {/* Risk Metrics */}
            <RiskMetrics metrics={riskMetrics} categories={threatCategories} />
          </div>

          {/* Right Column - Alerts */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 h-[calc(100vh-8rem)]">
              <AlertPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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

interface ConnectionStatusBannerProps {
  backendConnected: boolean;
  connectionError: string | null;
  activeMode: ConnectionMode;
}

function ConnectionStatusBanner({ backendConnected, connectionError, activeMode }: ConnectionStatusBannerProps) {
  if (activeMode === 'mock') return null;
  
  if (!backendConnected && activeMode === 'backend') {
    return (
      <div className="cyber-card border-red-500/50 bg-red-500/10 p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-red-400 font-semibold">Backend Connection Failed</p>
            <p className="text-red-400/70 text-sm">
              {connectionError || 'Unable to connect to threat intelligence API'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (backendConnected) {
    return (
      <div className="cyber-card border-emerald-500/50 bg-emerald-500/10 p-4">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-emerald-400 font-semibold">Backend Connected</p>
            <p className="text-emerald-400/70 text-sm">
              Real-time threat intelligence feed active
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}

interface ConnectionModeSelectorProps {
  mode: ConnectionMode;
  onChange: (mode: ConnectionMode) => void;
  backendConnected: boolean;
  realThreatCount: number;
  totalThreats: number;
}

function ConnectionModeSelector({ 
  mode, 
  onChange, 
  backendConnected, 
  realThreatCount, 
  totalThreats 
}: ConnectionModeSelectorProps) {
  const [backendUrl, setBackendUrl] = useState(getCurrentBackendUrl().replace('/api', ''));
  const [editingUrl, setEditingUrl] = useState(false);

  const handleSaveUrl = () => {
    saveBackendUrl(backendUrl);
    setEditingUrl(false);
    // Reload page to reconnect with new URL
    window.location.reload();
  };

  return (
    <div className="cyber-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-cyan-400/70">Connection Mode:</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={mode === 'auto' ? 'default' : 'outline'}
              onClick={() => onChange('auto')}
              className={mode === 'auto' ? 'bg-cyan-500 text-cyber-dark' : 'border-cyan-500/30 text-cyan-400'}
            >
              Auto
            </Button>
            <Button
              size="sm"
              variant={mode === 'backend' ? 'default' : 'outline'}
              onClick={() => onChange('backend')}
              className={mode === 'backend' ? 'bg-cyan-500 text-cyber-dark' : 'border-cyan-500/30 text-cyan-400'}
            >
              Backend API
            </Button>
            <Button
              size="sm"
              variant={mode === 'mock' ? 'default' : 'outline'}
              onClick={() => onChange('mock')}
              className={mode === 'mock' ? 'bg-cyan-500 text-cyber-dark' : 'border-cyan-500/30 text-cyan-400'}
            >
              Local Only
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
            {totalThreats} total threats
          </Badge>
          {backendConnected && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
              {realThreatCount} from live feeds
            </Badge>
          )}
        </div>
      </div>

      {/* Backend URL Configuration */}
      {(mode === 'backend' || mode === 'auto') && (
        <div className="flex items-center gap-3 pt-2 border-t border-cyan-500/20">
          <span className="text-xs text-cyan-400/50">Backend URL:</span>
          {editingUrl ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:3001"
                className="h-7 text-xs bg-cyber-dark border-cyan-500/30 text-cyan-400 max-w-md"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/10"
                onClick={handleSaveUrl}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-400 hover:bg-red-500/10"
                onClick={() => setEditingUrl(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <code className="text-xs text-cyan-400 bg-cyber-dark px-2 py-0.5 rounded">
                {getCurrentBackendUrl()}
              </code>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-cyan-400/60 hover:text-cyan-400"
                onClick={() => setEditingUrl(true)}
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              {!backendConnected && mode === 'backend' && (
                <span className="text-xs text-red-400/70 ml-2">
                  Cannot reach backend - check URL or start server
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-[10px] text-cyan-400/40">
        {mode === 'auto' 
          ? 'Auto-detect backend. Falls back to local data if unreachable.' 
          : mode === 'backend'
            ? 'Requires backend API server running at the URL above.'
            : 'Uses simulated data only - no backend connection needed.'
        }
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

export default App;

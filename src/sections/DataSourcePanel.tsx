import { useState } from 'react';
import { 
  Database, RefreshCw, Check, X, AlertTriangle, Key, Globe, 
  Play, Loader2, Share2, Radar, Fish, Building2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { DataSourceConfig } from '@/services/threatDataService';

interface DataSourcePanelProps {
  dataSources: DataSourceConfig[];
  onToggle: (id: string) => void;
  onUpdateApiKey: (id: string, apiKey: string) => void;
  onUpdateEndpoint?: (id: string, endpoint: string) => void;
  onRefresh: () => void;
  onTest?: (id: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
  lastFetch: number | null;
  backendConnected?: boolean;
}

const sourceIcons: Record<string, React.ElementType> = {
  misp: Share2,
  levelblue: Globe,
  shadowserver: Radar,
  cisa: Building2,
  openphish: Fish,
};

const sourceDescriptions: Record<string, string> = {
  misp: 'Open source Malware Information Sharing Platform with community threat events',
  levelblue: 'LevelBlue (AlienVault OTX) - Crowdsourced threat intelligence platform',
  shadowserver: 'ShadowServer Foundation - Internet security scanning and reports',
  cisa: 'US Cybersecurity & Infrastructure Security Agency advisories and alerts',
  openphish: 'Real-time phishing URL detection feed with AI-driven detection',
};

export function DataSourcePanel({ 
  dataSources, 
  onToggle, 
  onUpdateApiKey, 
  onUpdateEndpoint,
  onRefresh, 
  onTest,
  isLoading,
  lastFetch,
  backendConnected = false,
}: DataSourcePanelProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingEndpoint, setEditingEndpoint] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [endpointInput, setEndpointInput] = useState('');
  const [testingSource, setTestingSource] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const connectedCount = dataSources.filter(ds => ds.status === 'connected').length;
  const enabledCount = dataSources.filter(ds => ds.enabled).length;

  const formatLastFetch = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleTest = async (id: string) => {
    if (!onTest) return;
    
    setTestingSource(id);
    try {
      const result = await onTest(id);
      setTestResults(prev => ({ ...prev, [id]: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [id]: { success: false, message: 'Test failed' } 
      }));
    } finally {
      setTestingSource(null);
    }
  };

  return (
    <section className="cyber-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-orbitron text-lg font-semibold text-white tracking-wide">
              DATA SOURCES
            </h2>
            <p className="text-[10px] text-cyan-400/50">
              {connectedCount} connected / {enabledCount} enabled
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-cyan-400/50">
            Last fetch: {formatLastFetch(lastFetch)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading || !backendConnected}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Source List */}
      <div className="space-y-3">
        {dataSources.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-12 h-12 text-cyan-400/20 mx-auto mb-3" />
            <p className="text-cyan-400/50 text-sm">No data sources configured</p>
            {!backendConnected && (
              <p className="text-cyan-400/30 text-xs mt-1">
                Connect to backend to manage data sources
              </p>
            )}
          </div>
        ) : (
          dataSources.map((source) => {
            const Icon = sourceIcons[source.id] || Database;
            const needsApiKey = ['levelblue', 'shadowserver', 'misp'].includes(source.id) && source.requiresApiKey;
            const needsUrl = source.requiresUrl || source.id === 'misp';
            const testResult = testResults[source.id];
            
            return (
              <div 
                key={source.id}
                className={`p-3 rounded border ${
                  source.enabled 
                    ? source.status === 'connected' 
                      ? 'border-emerald-500/30 bg-emerald-500/5' 
                      : source.status === 'error'
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-amber-500/30 bg-amber-500/5'
                    : 'border-cyan-500/20 bg-cyber-dark/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      source.enabled 
                        ? source.status === 'connected'
                          ? 'bg-emerald-500/20'
                          : 'bg-amber-500/20'
                        : 'bg-cyan-500/10'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        source.enabled
                          ? source.status === 'connected'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                          : 'text-cyan-400/50'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-orbitron text-sm text-cyan-400">{source.name}</span>
                        {source.enabled && (
                          <StatusBadge status={source.status} />
                        )}
                      </div>
                      <p className="text-[10px] text-cyan-400/50 mt-0.5">
                        {sourceDescriptions[source.id]}
                      </p>
                      {source.enabled && source.lastFetch && (
                        <p className="text-[10px] text-cyan-400/40 mt-1">
                          Last update: {formatLastFetch(source.lastFetch)}
                        </p>
                      )}
                      
                      {/* Test Result */}
                      {testResult && (
                        <div className={`mt-2 text-[10px] flex items-center gap-1 ${
                          testResult.success ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {testResult.success ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {testResult.message}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {onTest && source.enabled && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10"
                        onClick={() => handleTest(source.id)}
                        disabled={testingSource === source.id}
                      >
                        {testingSource === source.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                    <Switch
                      checked={source.enabled}
                      onCheckedChange={() => onToggle(source.id)}
                      disabled={!backendConnected}
                      className="data-[state=checked]:bg-cyan-500"
                    />
                  </div>
                </div>

                {/* API Key Input */}
                {source.enabled && needsApiKey && (
                  <div className="mt-3 pl-11">
                    {editingKey === source.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="password"
                          placeholder="Enter API key"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          className="h-8 text-xs bg-cyber-dark border-cyan-500/30 text-cyan-400 placeholder:text-cyan-400/30"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => {
                            onUpdateApiKey(source.id, apiKeyInput);
                            setEditingKey(null);
                            setApiKeyInput('');
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            setEditingKey(null);
                            setApiKeyInput('');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Key className="w-3 h-3 text-cyan-400/50" />
                        <span className="text-[10px] text-cyan-400/50">
                          {source.apiKey ? 'API key configured' : 'API key required'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] text-cyan-400 hover:text-cyan-300"
                          onClick={() => setEditingKey(source.id)}
                          disabled={!backendConnected}
                        >
                          {source.apiKey ? 'Update' : 'Add Key'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Endpoint URL Input */}
                {source.enabled && needsUrl && (
                  <div className="mt-2 pl-11">
                    {editingEndpoint === source.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder="https://your-misp-instance.com"
                          value={endpointInput}
                          onChange={(e) => setEndpointInput(e.target.value)}
                          className="h-8 text-xs bg-cyber-dark border-cyan-500/30 text-cyan-400 placeholder:text-cyan-400/30"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => {
                            onUpdateEndpoint?.(source.id, endpointInput);
                            setEditingEndpoint(null);
                            setEndpointInput('');
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            setEditingEndpoint(null);
                            setEndpointInput('');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-cyan-400/50" />
                        <span className="text-[10px] text-cyan-400/50 truncate max-w-[200px]">
                          {source.endpoint || 'URL required'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] text-cyan-400 hover:text-cyan-300"
                          onClick={() => setEditingEndpoint(source.id)}
                          disabled={!backendConnected}
                        >
                          {source.endpoint ? 'Update' : 'Add URL'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-4 p-3 rounded bg-cyan-500/5 border border-cyan-500/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
          <div>
            <p className="text-xs text-cyan-400/70">
              <strong className="text-cyan-400">
                {backendConnected ? 'Live Mode:' : 'Demo Mode:'}
              </strong>{' '}
              {backendConnected 
                ? 'Connected to backend API. Enable Abuse.ch for free real-time threat data.'
                : 'Backend not connected. Using simulated data. Start the backend server for live feeds.'
              }
            </p>
            {backendConnected && (
              <ol className="text-[10px] text-cyan-400/50 mt-1 ml-4 list-decimal">
                <li>Enable Abuse.ch (free, no API key required)</li>
                <li>Add API keys for AlienVault OTX, VirusTotal, or MISP</li>
                <li>Click Test to verify connection, then Refresh to fetch data</li>
              </ol>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: DataSourceConfig['status'] }) {
  const config = {
    connected: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', label: 'Connected' },
    disconnected: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/50', label: 'Disconnected' },
    error: { color: 'bg-red-500/20 text-red-400 border-red-500/50', label: 'Error' },
  };

  const { color, label } = config[status];

  return (
    <Badge className={`text-[10px] ${color}`}>
      {label}
    </Badge>
  );
}

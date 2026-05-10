import { useState } from 'react';
import {
  Database, RefreshCw, Check, X, AlertTriangle, Key, Globe,
  Play, Loader2, Share2, Radar, Fish, Building2,
  Mountain, CloudAlert, Swords, Satellite, Flame, HeartHandshake, Newspaper,
  ChevronDown
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  canManage?: boolean;
}

const sourceIcons: Record<string, React.ElementType> = {
  misp: Share2,
  levelblue: Globe,
  shadowserver: Radar,
  cisa: Building2,
  openphish: Fish,
  usgs: Mountain,
  gdacs: CloudAlert,
  acled: Swords,
  eonet: Satellite,
  firms: Flame,
  reliefweb: HeartHandshake,
  gdelt: Newspaper,
};

const sourceDescriptions: Record<string, string> = {
  misp: 'Open source Malware Information Sharing Platform with community threat events',
  levelblue: 'LevelBlue (AlienVault OTX) - Crowdsourced threat intelligence platform',
  shadowserver: 'ShadowServer Foundation - Internet security scanning and reports',
  cisa: 'US Cybersecurity & Infrastructure Security Agency advisories and alerts',
  openphish: 'Real-time phishing URL detection feed with AI-driven detection',
  usgs: 'USGS real-time earthquake data — magnitude, depth, tsunami warnings worldwide',
  gdacs: 'UN/EC global disaster alerts — earthquakes, floods, cyclones, volcanoes, wildfires',
  acled: 'Armed conflict, political violence, protests, and riots — 240+ countries (free key required)',
  eonet: 'NASA Earth Observatory — wildfires, volcanic eruptions, severe storms, floods',
  firms: 'NASA satellite fire/hotspot detection — MODIS & VIIRS near real-time data (free key required)',
  reliefweb: 'UN OCHA humanitarian crisis reports, disaster updates, and situation reports',
  gdelt: 'Global media-reported events — conflicts, disasters, unrest — updated every 15 minutes',
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
  canManage = true,
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
      if (result.success) onRefresh();
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [id]: { success: false, message: 'Test failed' } 
      }));
    } finally {
      setTestingSource(null);
    }
  };

  const [infoExpanded, setInfoExpanded] = useState(false);

  return (
    <div className="space-y-3">
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
          {canManage && (
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
          )}
        </div>
      </div>

      {/* Data Source List — scrollable */}
      <ScrollArea className="h-[420px] pr-3">
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
            const needsApiKey = !!source.requiresApiKey;
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
                        : source.status === 'demo'
                          ? 'border-purple-500/30 bg-purple-500/5'
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
                          : source.status === 'demo'
                            ? 'bg-purple-500/20'
                            : 'bg-amber-500/20'
                        : 'bg-cyan-500/10'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        source.enabled
                          ? source.status === 'connected'
                            ? 'text-emerald-400'
                            : source.status === 'demo'
                              ? 'text-purple-400'
                              : 'text-amber-400'
                          : 'text-cyan-400/50'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-orbitron text-sm text-cyan-400">{source.name}</span>
                        {source.enabled && (
                          <StatusBadge status={source.status} statusMessage={source.statusMessage} />
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
                    {canManage && onTest && source.enabled && (
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
                    {canManage && (
                      <Switch
                        checked={source.enabled}
                        onCheckedChange={() => onToggle(source.id)}
                        disabled={!backendConnected}
                        className="data-[state=checked]:bg-cyan-500"
                      />
                    )}
                  </div>
                </div>

                {/* API Key Input */}
                {canManage && source.enabled && needsApiKey && (
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
                {canManage && source.enabled && needsUrl && (
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

      </ScrollArea>
    </section>

    {/* Live/Demo Mode Info — collapsible, outside data sources card */}
    <div className="cyber-card">
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setInfoExpanded(!infoExpanded)}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-cyan-400/70">
            <strong className="text-cyan-400">
              {backendConnected ? 'Live Mode:' : 'Demo Mode:'}
            </strong>{' '}
            {backendConnected
              ? 'Connected to backend API. Many sources work out of the box — no API key needed.'
              : 'Backend not connected. Using simulated data. Start the backend server for live feeds.'
            }
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-cyan-400/40 flex-shrink-0 transition-transform duration-200 ${infoExpanded ? 'rotate-180' : ''}`} />
      </div>

      <div className={`overflow-hidden transition-all duration-300 ${infoExpanded ? 'max-h-[300px]' : 'max-h-0'}`}>
        <div className="border-t border-cyan-500/10">
          <ScrollArea className="h-[260px]">
            <div className="px-3 py-2 text-[10px] text-cyan-400/50 space-y-3">

              <div>
                <p className="font-semibold text-cyan-400/60 mb-1">Cyber Threat Sources</p>
                <div className="ml-3 space-y-1">
                  <p><span className="text-cyan-400">CISA KEV</span> — Known Exploited Vulnerabilities catalog. No key required.</p>
                  <p><span className="text-cyan-400">OpenPhish</span> — Real-time phishing URL feed with AI detection. No key required.</p>
                  <p><span className="text-cyan-400">LevelBlue OTX</span> — Crowdsourced threat intel (AlienVault). Free registration at otx.alienvault.com.</p>
                  <p><span className="text-cyan-400">ShadowServer</span> — Internet security scanning &amp; reports. Approved API key required.</p>
                  <p><span className="text-cyan-400">MISP</span> — Malware Information Sharing Platform. Self-hosted instance URL + auth key.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-cyan-400/60 mb-1">Natural Disaster Sources</p>
                <div className="ml-3 space-y-1">
                  <p><span className="text-cyan-400">USGS Earthquake</span> — Real-time seismic data, magnitude, depth, tsunami warnings. No key required.</p>
                  <p><span className="text-cyan-400">GDACS</span> — UN/EC global disaster alerts: earthquakes, floods, cyclones, volcanoes. No key required.</p>
                  <p><span className="text-cyan-400">NASA EONET</span> — Earth Observatory natural events: wildfires, eruptions, storms. No key required.</p>
                  <p><span className="text-cyan-400">NASA FIRMS</span> — Satellite fire/hotspot detection (MODIS &amp; VIIRS). Free key at firms.modaps.eosdis.nasa.gov.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-cyan-400/60 mb-1">Geopolitical &amp; Humanitarian Sources</p>
                <div className="ml-3 space-y-1">
                  <p><span className="text-cyan-400">ACLED</span> — Armed conflict, political violence, protests in 240+ countries. Free key at acleddata.com.</p>
                  <p><span className="text-cyan-400">ReliefWeb</span> — UN OCHA humanitarian crisis reports &amp; situation updates. Free appname at apidoc.reliefweb.int.</p>
                  <p><span className="text-cyan-400">GDELT</span> — Global media-monitored events: conflicts, disasters, unrest. No key required.</p>
                </div>
              </div>

              <p className="text-cyan-400/40 pt-1">Click Test to verify a connection, then Refresh to pull new data.</p>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
    </div>
  );
}

function StatusBadge({ status, statusMessage }: { status: DataSourceConfig['status']; statusMessage?: string }) {
  const config = {
    connected: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', label: 'Connected' },
    disconnected: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/50', label: 'Disconnected' },
    error: { color: 'bg-red-500/20 text-red-400 border-red-500/50', label: 'Error' },
    demo: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/50', label: 'Demo' },
  };

  const { color, label } = config[status] || config.disconnected;

  return (
    <span className="inline-flex flex-col">
      <Badge className={`text-[10px] ${color}`}>
        {label}
      </Badge>
      {status === 'demo' && statusMessage && (
        <span className="text-[9px] text-purple-400/70 mt-0.5">{statusMessage}</span>
      )}
    </span>
  );
}

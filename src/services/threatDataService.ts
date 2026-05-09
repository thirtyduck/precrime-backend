import type { Threat, RiskMetric, ThreatCategory } from '@/types/threat';

// Data Source Configuration
export interface DataSourceConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  refreshInterval: number; // in seconds
  lastFetch?: number;
  status: 'connected' | 'disconnected' | 'error';
  requiresApiKey?: boolean;
  requiresUrl?: boolean;
  description?: string;
}

// Default data sources
export const DEFAULT_DATA_SOURCES: DataSourceConfig[] = [
  {
    id: 'cisa',
    name: 'CISA Alerts',
    enabled: true,
    endpoint: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    refreshInterval: 300,
    status: 'disconnected',
  },
  {
    id: 'abusech',
    name: 'Abuse.ch Threat Feeds',
    enabled: true,
    endpoint: 'https://threatfox-api.abuse.ch/api/v1/',
    refreshInterval: 60,
    status: 'disconnected',
  },
  {
    id: 'alienvault',
    name: 'AlienVault OTX',
    enabled: false,
    refreshInterval: 600,
    status: 'disconnected',
  },
  {
    id: 'virustotal',
    name: 'VirusTotal',
    enabled: false,
    refreshInterval: 60,
    status: 'disconnected',
  },
  {
    id: 'misp',
    name: 'MISP Instance',
    enabled: false,
    refreshInterval: 300,
    status: 'disconnected',
  },
];

// Real data fetchers (would connect to actual APIs in production)
class ThreatDataService {
  private dataSources: DataSourceConfig[] = DEFAULT_DATA_SOURCES;
  private fetchInterval: ReturnType<typeof setInterval> | null = null;

  // Fetch from Abuse.ch ThreatFox (free, no API key required for basic usage)
  async fetchAbuseChData(): Promise<Partial<Threat>[]> {
    try {
      // In production, this would be:
      // const response = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ query: 'get_iocs', limit: 50 })
      // });
      
      // Simulated real data structure based on actual ThreatFox format
      return [
        {
          id: 'THR-ABUSE-001',
          title: 'Malware C2 Server Detected',
          description: 'Active command and control server for Emotet malware family detected',
          severity: 'critical' as const,
          category: 'Cyber Attack',
          location: '185.234.xxx.xxx (Netherlands)',
          confidence: 96,
          indicators: ['IOC: 185.234.xxx.xxx', 'Domain: update-service.biz', 'Hash: a3f5c8...'],
        },
        {
          id: 'THR-ABUSE-002',
          title: 'Phishing Campaign Active',
          description: 'Large-scale phishing campaign targeting financial institutions',
          severity: 'high' as const,
          category: 'Social Engineering',
          location: 'Multiple regions',
          confidence: 89,
          indicators: ['Domain: secure-banking-verify.net', 'URL pattern: /login/verify'],
        },
      ];
    } catch (error) {
      console.error('Failed to fetch Abuse.ch data:', error);
      return [];
    }
  }

  // Fetch from CISA (Cybersecurity & Infrastructure Security Agency)
  async fetchCISAData(): Promise<Partial<Threat>[]> {
    try {
      // In production: const response = await fetch('https://api.cisa.gov/alerts');
      
      return [
        {
          id: 'CISA-AA24-089A',
          title: 'Critical Infrastructure Vulnerability',
          description: 'CISA Alert: Active exploitation of CVE-2024-XXXX in industrial control systems',
          severity: 'critical' as const,
          category: 'Cyber Attack',
          location: 'Critical Infrastructure Sectors',
          confidence: 94,
          indicators: ['CVE-2024-XXXX', 'APT group activity', 'ICS/SCADA targeting'],
        },
        {
          id: 'CISA-AA24-087B',
          title: 'Ransomware Advisory',
          description: 'CISA/FBI joint advisory on new ransomware variant targeting healthcare',
          severity: 'high' as const,
          category: 'Cyber Attack',
          location: 'Healthcare Sector - US/CA/UK',
          confidence: 91,
          indicators: ['Ransomware: LockBit derivative', 'Initial access: VPN exploits'],
        },
      ];
    } catch (error) {
      console.error('Failed to fetch CISA data:', error);
      return [];
    }
  }

  // Fetch from AlienVault OTX (requires API key)
  async fetchAlienVaultData(apiKey?: string): Promise<Partial<Threat>[]> {
    if (!apiKey) {
      console.warn('AlienVault OTX API key not configured');
      return [];
    }
    
    try {
      // In production:
      // const response = await fetch('https://otx.alienvault.com/api/v1/pulses/subscribed', {
      //   headers: { 'X-OTX-API-KEY': apiKey }
      // });
      
      return [
        {
          id: 'OTX-PULSE-001',
          title: 'APT29 Campaign Indicators',
          description: 'Observed indicators associated with APT29 (Cozy Bear) activity',
          severity: 'high' as const,
          category: 'Cyber Attack',
          location: 'Government Networks',
          confidence: 87,
          indicators: ['TTP: Spear phishing', 'Malware: WellMess variant'],
        },
      ];
    } catch (error) {
      console.error('Failed to fetch AlienVault data:', error);
      return [];
    }
  }

  // Aggregate all enabled data sources
  async fetchAllThreats(): Promise<Threat[]> {
    const threats: Threat[] = [];
    const now = Date.now();

    // Fetch from enabled sources
    for (const source of this.dataSources) {
      if (!source.enabled) continue;

      let sourceThreats: Partial<Threat>[] = [];

      switch (source.id) {
        case 'abusech':
          sourceThreats = await this.fetchAbuseChData();
          source.lastFetch = now;
          source.status = 'connected';
          break;
        case 'cisa':
          sourceThreats = await this.fetchCISAData();
          source.lastFetch = now;
          source.status = 'connected';
          break;
        case 'alienvault':
          sourceThreats = await this.fetchAlienVaultData(source.apiKey);
          source.lastFetch = now;
          source.status = source.apiKey ? 'connected' : 'error';
          break;
        default:
          break;
      }

      // Transform and add to threats array
      sourceThreats.forEach((t, i) => {
        threats.push({
          id: t.id || `${source.id}-${i}`,
          title: t.title || 'Unknown Threat',
          description: t.description || '',
          severity: t.severity || 'medium',
          category: t.category || 'Unknown',
          location: t.location || 'Unknown',
          predictedTime: t.predictedTime || 'Unknown',
          confidence: t.confidence || 50,
          indicators: t.indicators || [],
          status: 'active',
          timestamp: now,
          ...t,
        } as Threat);
      });
    }

    return threats;
  }

  // Calculate risk metrics from real data
  calculateRiskMetrics(threats: Threat[]): RiskMetric[] {
    const cyberThreats = threats.filter(t => 
      ['Cyber Attack', 'Malware', 'Ransomware'].includes(t.category)
    );
    const internalThreats = threats.filter(t => 
      ['Internal Security', 'Insider Threat'].includes(t.category)
    );
    const financialThreats = threats.filter(t => 
      ['Financial', 'Fraud'].includes(t.category)
    );

    const avgConfidence = (categoryThreats: Threat[]) => 
      categoryThreats.length > 0
        ? categoryThreats.reduce((sum, t) => sum + t.confidence, 0) / categoryThreats.length
        : 0;

    return [
      { 
        name: 'Cyber Risk', 
        value: Math.min(100, Math.round(avgConfidence(cyberThreats) * 0.8 + cyberThreats.length * 2)), 
        trend: cyberThreats.length > 3 ? 'up' : 'stable', 
        change: cyberThreats.length > 3 ? 12 : 0 
      },
      { 
        name: 'Operational', 
        value: Math.min(100, Math.round(avgConfidence(internalThreats) * 0.6)), 
        trend: 'stable', 
        change: 0 
      },
      { 
        name: 'Financial', 
        value: Math.min(100, Math.round(avgConfidence(financialThreats) * 0.7 + financialThreats.length * 3)), 
        trend: financialThreats.length > 0 ? 'up' : 'down', 
        change: financialThreats.length > 0 ? 8 : -2 
      },
      { 
        name: 'Compliance', 
        value: 34, 
        trend: 'stable', 
        change: 2 
      },
      { 
        name: 'Reputation', 
        value: Math.min(100, Math.round(threats.filter(t => t.severity === 'critical').length * 15)), 
        trend: threats.filter(t => t.severity === 'critical').length > 2 ? 'up' : 'stable', 
        change: threats.filter(t => t.severity === 'critical').length > 2 ? 8 : 0 
      },
    ];
  }

  // Calculate threat categories from real data
  calculateThreatCategories(threats: Threat[]): ThreatCategory[] {
    const categories: Record<string, { count: number; color: string }> = {
      'Cyber Attack': { count: 0, color: '#ff0040' },
      'Internal Security': { count: 0, color: '#ffbf00' },
      'Financial': { count: 0, color: '#00ffff' },
      'Logistics': { count: 0, color: '#00ff80' },
      'Social Engineering': { count: 0, color: '#ff6b35' },
    };

    threats.forEach(t => {
      if (categories[t.category]) {
        categories[t.category].count++;
      }
    });

    return Object.entries(categories).map(([name, data]) => ({
      name,
      count: data.count,
      trend: data.count > 0 ? Math.floor(Math.random() * 20) - 5 : 0,
      color: data.color,
    }));
  }

  // Get data source status
  getDataSources(): DataSourceConfig[] {
    return this.dataSources;
  }

  // Update data source configuration
  updateDataSource(id: string, updates: Partial<DataSourceConfig>) {
    const index = this.dataSources.findIndex(ds => ds.id === id);
    if (index !== -1) {
      this.dataSources[index] = { ...this.dataSources[index], ...updates };
    }
  }

  // Start automatic data fetching
  startAutoFetch(callback: (threats: Threat[]) => void, interval: number = 60000) {
    this.stopAutoFetch();
    
    // Initial fetch
    this.fetchAllThreats().then(callback);
    
    // Set up interval
    this.fetchInterval = setInterval(() => {
      this.fetchAllThreats().then(callback);
    }, interval);
  }

  // Stop automatic data fetching
  stopAutoFetch() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
    }
  }
}

// Export singleton instance
export const threatDataService = new ThreatDataService();

// For real-time WebSocket simulation (would connect to actual WebSocket in production)
export class ThreatWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  connect(_url: string) {
    // In production: this.ws = new WebSocket(url);
    // For demo, simulate WebSocket with EventSource-like behavior
    console.log('Connecting to threat intelligence stream...');
    
    // Simulate incoming threat alerts
    setInterval(() => {
      if (Math.random() > 0.7) {
        this.emit('threat', {
          id: `THR-WS-${Date.now()}`,
          title: 'New Threat Detected',
          severity: Math.random() > 0.8 ? 'critical' : Math.random() > 0.5 ? 'high' : 'medium',
          timestamp: Date.now(),
        });
      }
    }, 15000);
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const threatWebSocket = new ThreatWebSocket();

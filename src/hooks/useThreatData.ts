import { useState, useEffect, useCallback, useRef } from 'react';
import { threatDataService, threatWebSocket, type DataSourceConfig } from '@/services/threatDataService';
import type { Threat, Alert, RiskMetric, SystemStatus, ThreatCategory } from '@/types/threat';

// Mock data generators (fallback when no real data)
const generateMockThreats = (): Threat[] => [
  {
    id: 'THR-001',
    title: 'DDoS Attack Imminent',
    description: 'Predicted distributed denial of service attack targeting financial infrastructure',
    severity: 'critical',
    category: 'Cyber Attack',
    location: 'Global - Financial Sector',
    predictedTime: '14 minutes',
    confidence: 94,
    indicators: ['Traffic anomaly', 'Botnet activity', 'Target reconnaissance'],
    status: 'active',
    timestamp: Date.now(),
  },
  {
    id: 'THR-002',
    title: 'Supply Chain Disruption',
    description: 'Logistics network vulnerability detected in Asian shipping routes',
    severity: 'high',
    category: 'Logistics',
    location: 'Asia-Pacific',
    predictedTime: '2 hours',
    confidence: 87,
    indicators: ['Port congestion', 'Weather patterns', 'Labor disputes'],
    status: 'monitoring',
    timestamp: Date.now() - 300000,
  },
  {
    id: 'THR-003',
    title: 'Insider Threat Pattern',
    description: 'Anomalous data access patterns from privileged user accounts',
    severity: 'high',
    category: 'Internal Security',
    location: 'Corporate Network',
    predictedTime: '45 minutes',
    confidence: 82,
    indicators: ['Off-hours access', 'Bulk downloads', 'Unauthorized queries'],
    status: 'active',
    timestamp: Date.now() - 600000,
  },
  {
    id: 'THR-004',
    title: 'Market Volatility Spike',
    description: 'Algorithmic prediction of significant market fluctuation',
    severity: 'medium',
    category: 'Financial',
    location: 'NYSE / NASDAQ',
    predictedTime: '3 hours',
    confidence: 76,
    indicators: ['Options flow', 'Sentiment analysis', 'Correlation breakdown'],
    status: 'monitoring',
    timestamp: Date.now() - 900000,
  },
  {
    id: 'THR-005',
    title: 'Ransomware Campaign',
    description: 'New strain of ransomware targeting healthcare systems',
    severity: 'critical',
    category: 'Cyber Attack',
    location: 'Healthcare Networks',
    predictedTime: '28 minutes',
    confidence: 91,
    indicators: ['Phishing emails', 'Malware signatures', 'C2 communications'],
    status: 'active',
    timestamp: Date.now() - 1200000,
  },
  {
    id: 'THR-006',
    title: 'Social Engineering Wave',
    description: 'Coordinated phishing campaign against executive team',
    severity: 'medium',
    category: 'Social Engineering',
    location: 'Corporate Email',
    predictedTime: '1 hour',
    confidence: 79,
    indicators: ['Spear phishing', 'Domain spoofing', 'Impersonation'],
    status: 'monitoring',
    timestamp: Date.now() - 1500000,
  },
];

const generateMockAlerts = (): Alert[] => [
  {
    id: 'ALT-001',
    type: 'critical',
    message: 'Critical threat detected: DDoS attack predicted in 14 minutes',
    timestamp: Date.now(),
    acknowledged: false,
  },
  {
    id: 'ALT-002',
    type: 'warning',
    message: 'System load approaching threshold - scaling recommended',
    timestamp: Date.now() - 180000,
    acknowledged: false,
  },
  {
    id: 'ALT-003',
    type: 'info',
    message: 'New threat intelligence feed connected',
    timestamp: Date.now() - 360000,
    acknowledged: true,
  },
];

const generateSystemStatus = (dataSources: DataSourceConfig[]): SystemStatus => {
  const connectedSources = dataSources.filter(ds => ds.enabled && ds.status === 'connected').length;
  
  return {
    online: true,
    uptime: '99.97%',
    dataSources: connectedSources > 0 ? connectedSources : 847,
    lastUpdate: new Date().toLocaleTimeString(),
    predictionAccuracy: connectedSources > 0 ? 94.2 : 91.4,
  };
};

export type DataMode = 'mock' | 'real' | 'hybrid';

export function useThreatData(mode: DataMode = 'hybrid') {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>(generateMockAlerts());
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(generateSystemStatus([]));
  const [threatCategories, setThreatCategories] = useState<ThreatCategory[]>([]);
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>(threatDataService.getDataSources());
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [lastDataFetch, setLastDataFetch] = useState<number | null>(null);
  const [useRealData, setUseRealData] = useState(mode !== 'mock');
  
  const fetchInProgress = useRef(false);

  // Fetch real data from enabled sources
  const fetchRealData = useCallback(async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    setIsLoading(true);

    try {
      const realThreats = await threatDataService.fetchAllThreats();
      
      if (realThreats.length > 0) {
        const metrics = threatDataService.calculateRiskMetrics(realThreats);
        const categories = threatDataService.calculateThreatCategories(realThreats);
        
        setThreats(prev => {
          // Merge with existing threats, avoiding duplicates
          const existingIds = new Set(prev.map(t => t.id));
          const newThreats = realThreats.filter(t => !existingIds.has(t.id));
          
          if (mode === 'hybrid') {
            return [...prev, ...newThreats].slice(0, 20); // Keep max 20 threats
          }
          return realThreats;
        });
        
        setRiskMetrics(metrics);
        setThreatCategories(categories);
        setLastDataFetch(Date.now());
        
        // Generate alerts for critical threats
        const criticalThreats = realThreats.filter(t => t.severity === 'critical' && t.timestamp > Date.now() - 300000);
        criticalThreats.forEach(threat => {
          setAlerts(prev => {
            const exists = prev.some(a => a.message.includes(threat.id));
            if (!exists) {
              return [{
                id: `ALT-${threat.id}`,
                type: 'critical',
                message: `Critical threat detected: ${threat.title} (${threat.id})`,
                timestamp: Date.now(),
                acknowledged: false,
              }, ...prev];
            }
            return prev;
          });
        });
      }
      
      // Update data sources status
      setDataSources(threatDataService.getDataSources());
    } catch (error) {
      console.error('Failed to fetch real data:', error);
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [mode]);

  // Initialize data based on mode
  useEffect(() => {
    if (mode === 'mock') {
      // Use only mock data
      const mockThreats = generateMockThreats();
      setThreats(mockThreats);
      setRiskMetrics([
        { name: 'Cyber Risk', value: 78, trend: 'up', change: 12 },
        { name: 'Operational', value: 45, trend: 'stable', change: 0 },
        { name: 'Financial', value: 62, trend: 'down', change: -5 },
        { name: 'Compliance', value: 34, trend: 'stable', change: 2 },
        { name: 'Reputation', value: 51, trend: 'up', change: 8 },
      ]);
      setThreatCategories([
        { name: 'Cyber Attack', count: 23, trend: 15, color: '#ff0040' },
        { name: 'Internal Security', count: 12, trend: -3, color: '#ffbf00' },
        { name: 'Financial', count: 18, trend: 8, color: '#00ffff' },
        { name: 'Logistics', count: 9, trend: 2, color: '#00ff80' },
        { name: 'Social Engineering', count: 15, trend: 5, color: '#ff6b35' },
      ]);
    } else if (mode === 'real' || mode === 'hybrid') {
      // Start with mock data, then fetch real data
      if (mode === 'hybrid') {
        setThreats(generateMockThreats());
      }
      fetchRealData();
      
      // Set up periodic fetching
      const interval = setInterval(fetchRealData, 60000); // Fetch every minute
      return () => clearInterval(interval);
    }
  }, [mode, fetchRealData]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      setSystemStatus(generateSystemStatus(dataSources));
      
      // Randomly update threat confidence
      setThreats(prev => prev.map(threat => ({
        ...threat,
        confidence: Math.min(99, Math.max(50, threat.confidence + (Math.random() - 0.5) * 2)),
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [dataSources]);

  // WebSocket simulation for real-time alerts
  useEffect(() => {
    if (useRealData) {
      threatWebSocket.connect('wss://threat-stream.example.com');
      
      threatWebSocket.on('threat', (data) => {
        setAlerts(prev => [{
          id: `ALT-WS-${Date.now()}`,
          type: data.severity === 'critical' ? 'critical' : 'warning',
          message: `Real-time alert: ${data.title}`,
          timestamp: Date.now(),
          acknowledged: false,
        }, ...prev]);
      });
      
      return () => threatWebSocket.disconnect();
    }
  }, [useRealData]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const dismissThreat = useCallback((threatId: string) => {
    setThreats(prev => prev.filter(threat => threat.id !== threatId));
  }, []);

  const getThreatsBySeverity = useCallback((severity: Threat['severity']) => {
    return threats.filter(t => t.severity === severity);
  }, [threats]);

  const getActiveAlerts = useCallback(() => {
    return alerts.filter(a => !a.acknowledged);
  }, [alerts]);

  const toggleDataSource = useCallback((id: string) => {
    const source = dataSources.find(ds => ds.id === id);
    if (source) {
      threatDataService.updateDataSource(id, { enabled: !source.enabled });
      setDataSources(threatDataService.getDataSources());
      fetchRealData(); // Refetch with new configuration
    }
  }, [dataSources, fetchRealData]);

  const updateDataSourceApiKey = useCallback((id: string, apiKey: string) => {
    threatDataService.updateDataSource(id, { apiKey });
    setDataSources(threatDataService.getDataSources());
  }, []);

  const refreshData = useCallback(async () => {
    await fetchRealData();
  }, [fetchRealData]);

  return {
    threats,
    alerts,
    riskMetrics,
    systemStatus,
    threatCategories,
    dataSources,
    currentTime,
    isLoading,
    lastDataFetch,
    useRealData,
    acknowledgeAlert,
    dismissThreat,
    getThreatsBySeverity,
    getActiveAlerts,
    toggleDataSource,
    updateDataSourceApiKey,
    refreshData,
    setUseRealData,
  };
}

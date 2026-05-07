import { useState, useEffect, useCallback, useRef } from 'react';
import { threatAPI, dataSourceAPI, systemAPI, threatWebSocket } from '@/services/api';
import type { Threat, Alert, RiskMetric, SystemStatus, ThreatCategory } from '@/types/threat';
import type { DataSourceConfig } from '@/services/threatDataService';

// Mock data generators (fallback when backend is unavailable)
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

export type ConnectionMode = 'backend' | 'mock' | 'auto';

export function useBackendThreatData(mode: ConnectionMode = 'auto') {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>(generateMockAlerts());
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    online: true,
    uptime: '99.97%',
    dataSources: 0,
    lastUpdate: new Date().toLocaleTimeString(),
    predictionAccuracy: 91.4,
  });
  const [threatCategories, setThreatCategories] = useState<ThreatCategory[]>([]);
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [lastDataFetch, setLastDataFetch] = useState<number | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const activeMode = useRef<ConnectionMode>(mode);

  // Check backend health and determine mode
  const checkBackendHealth = useCallback(async () => {
    if (mode === 'mock') return false;
    
    try {
      await systemAPI.health();
      setBackendConnected(true);
      setConnectionError(null);
      return true;
    } catch (error) {
      console.warn('Backend not available:', error);
      setBackendConnected(false);
      setConnectionError('Backend API unavailable');
      return false;
    }
  }, [mode]);

  // Fetch threats from backend
  const fetchThreatsFromBackend = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await threatAPI.getThreats({ limit: 50 });
      setThreats(response.threats);
      setLastDataFetch(Date.now());
      
      // Generate alerts for critical threats
      const criticalThreats = response.threats.filter(
        (t: Threat) => t.severity === 'critical' && t.timestamp > Date.now() - 300000
      );
      
      criticalThreats.forEach((threat: Threat) => {
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
    } catch (error) {
      console.error('Failed to fetch threats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch risk metrics from backend
  const fetchMetricsFromBackend = useCallback(async () => {
    try {
      const response = await threatAPI.getMetrics();
      setRiskMetrics(response.metrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  }, []);

  // Fetch threat categories from backend
  const fetchCategoriesFromBackend = useCallback(async () => {
    try {
      const response = await threatAPI.getCategories();
      setThreatCategories(response.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  // Fetch data sources from backend
  const fetchDataSourcesFromBackend = useCallback(async () => {
    try {
      const response = await dataSourceAPI.getAll();
      setDataSources(response.dataSources);
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
    }
  }, []);

  // Fetch system status from backend
  const fetchSystemStatusFromBackend = useCallback(async () => {
    try {
      const response = await systemAPI.getStatus();
      setSystemStatus({
        online: response.online,
        uptime: response.uptime,
        dataSources: response.dataSources,
        lastUpdate: new Date(response.lastUpdate).toLocaleTimeString(),
        predictionAccuracy: response.predictionAccuracy,
      });
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  }, []);

  // Initialize data based on mode
  useEffect(() => {
    const initialize = async () => {
      const isBackendAvailable = await checkBackendHealth();
      
      if (isBackendAvailable && mode !== 'mock') {
        activeMode.current = 'backend';
        await Promise.all([
          fetchThreatsFromBackend(),
          fetchMetricsFromBackend(),
          fetchCategoriesFromBackend(),
          fetchDataSourcesFromBackend(),
          fetchSystemStatusFromBackend(),
        ]);
      } else {
        activeMode.current = 'mock';
        // Use mock data
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
      }
    };

    initialize();
  }, [mode, checkBackendHealth, fetchThreatsFromBackend, fetchMetricsFromBackend, fetchCategoriesFromBackend, fetchDataSourcesFromBackend, fetchSystemStatusFromBackend]);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    if (backendConnected) {
      threatWebSocket.connect();

      threatWebSocket.on('threats-update', (data) => {
        console.log('Received real-time threat update:', data);
        fetchThreatsFromBackend();
      });

      threatWebSocket.on('alert', (data) => {
        console.log('Received real-time alert:', data);
        setAlerts(prev => [{
          id: `ALT-WS-${Date.now()}`,
          type: data.severity === 'critical' ? 'critical' : 'warning',
          message: data.message,
          timestamp: Date.now(),
          acknowledged: false,
        }, ...prev]);
      });

      return () => {
        threatWebSocket.disconnect();
      };
    }
  }, [backendConnected, fetchThreatsFromBackend]);

  // Simulate real-time updates (for both modes)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      
      // Update system status
      setSystemStatus(prev => ({
        ...prev,
        lastUpdate: new Date().toLocaleTimeString(),
      }));
      
      // Randomly update threat confidence
      setThreats(prev => prev.map(threat => ({
        ...threat,
        confidence: Math.min(99, Math.max(50, threat.confidence + (Math.random() - 0.5) * 2)),
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Periodic data refresh from backend
  useEffect(() => {
    if (backendConnected && activeMode.current === 'backend') {
      const interval = setInterval(() => {
        fetchThreatsFromBackend();
        fetchSystemStatusFromBackend();
      }, 60000); // Refresh every minute

      return () => clearInterval(interval);
    }
  }, [backendConnected, fetchThreatsFromBackend, fetchSystemStatusFromBackend]);

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

  const toggleDataSource = useCallback(async (id: string) => {
    const source = dataSources.find(ds => ds.id === id);
    if (source) {
      if (backendConnected) {
        try {
          await dataSourceAPI.update(id, { enabled: !source.enabled });
          await fetchDataSourcesFromBackend();
          await fetchThreatsFromBackend(); // Refresh threats with new config
        } catch (error) {
          console.error('Failed to toggle data source:', error);
        }
      } else {
        // Mock mode - just update local state
        setDataSources(prev => prev.map(ds => 
          ds.id === id ? { ...ds, enabled: !ds.enabled } : ds
        ));
      }
    }
  }, [dataSources, backendConnected, fetchDataSourcesFromBackend, fetchThreatsFromBackend]);

  const updateDataSourceApiKey = useCallback(async (id: string, apiKey: string) => {
    if (backendConnected) {
      try {
        await dataSourceAPI.update(id, { apiKey });
        await fetchDataSourcesFromBackend();
      } catch (error) {
        console.error('Failed to update API key:', error);
      }
    }
  }, [backendConnected, fetchDataSourcesFromBackend]);

  const updateDataSourceEndpoint = useCallback(async (id: string, endpoint: string) => {
    if (backendConnected) {
      try {
        await dataSourceAPI.update(id, { endpoint });
        await fetchDataSourcesFromBackend();
      } catch (error) {
        console.error('Failed to update endpoint:', error);
      }
    }
  }, [backendConnected, fetchDataSourcesFromBackend]);

  const refreshData = useCallback(async () => {
    if (backendConnected) {
      setIsLoading(true);
      try {
        await threatAPI.refresh();
        await fetchThreatsFromBackend();
        await fetchMetricsFromBackend();
        await fetchCategoriesFromBackend();
      } catch (error) {
        console.error('Failed to refresh data:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [backendConnected, fetchThreatsFromBackend, fetchMetricsFromBackend, fetchCategoriesFromBackend]);

  const testDataSource = useCallback(async (id: string) => {
    if (backendConnected) {
      try {
        return await dataSourceAPI.test(id);
      } catch (error) {
        console.error('Failed to test data source:', error);
        return { success: false, message: 'Test failed' };
      }
    }
    return { success: false, message: 'Backend not connected' };
  }, [backendConnected]);

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
    backendConnected,
    connectionError,
    activeMode: activeMode.current,
    acknowledgeAlert,
    dismissThreat,
    getThreatsBySeverity,
    getActiveAlerts,
    toggleDataSource,
    updateDataSourceApiKey,
    updateDataSourceEndpoint,
    refreshData,
    testDataSource,
  };
}

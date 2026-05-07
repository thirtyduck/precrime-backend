export interface Threat {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  location: string;
  predictedTime: string;
  confidence: number;
  indicators: string[];
  status: 'active' | 'mitigated' | 'monitoring';
  timestamp: number;
  source?: string;
  raw?: any;
}

export interface RiskMetric {
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface SystemStatus {
  online: boolean;
  uptime: string;
  dataSources: number;
  lastUpdate: string;
  predictionAccuracy: number;
}

export interface ThreatCategory {
  name: string;
  count: number;
  trend: number;
  color: string;
}

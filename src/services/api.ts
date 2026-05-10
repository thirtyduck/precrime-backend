// API client for connecting to the Precrime Threat Intelligence Backend

// Auth token getter — set by AuthProvider
let tokenGetter: (() => string | null) | null = null;

export function setAuthTokenGetter(getter: () => string | null) {
  tokenGetter = getter;
}

// Get backend URL from localStorage or use default
export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('precrime_backend_url');
    if (stored) return stored;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
}

function getWsUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('precrime_backend_url');
    if (stored) {
      // Convert http to ws
      return stored.replace('http://', 'ws://').replace('https://', 'wss://').replace('/api', '');
    }
  }
  return import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
}

export function setBackendUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const normalized = url.replace(/\/$/, '');
    localStorage.setItem('precrime_backend_url', normalized);
  }
}

export function getCurrentBackendUrl(): string {
  return getBackendUrl();
}

// Generic fetch wrapper with error handling
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${getBackendUrl()}${endpoint}`;
  const token = tokenGetter ? tokenGetter() : null;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    if (response.status === 401 || response.status === 403) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new Error('Authentication expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Threat API
export const threatAPI = {
  getThreats: (params?: { severity?: string; category?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    return fetchAPI<{
      threats: any[];
      pagination: { total: number; limit: number; offset: number; hasMore: boolean };
      timestamp: string;
    }>(`/threats?${queryParams.toString()}`);
  },

  getStats: () => fetchAPI<{
    total: number;
    bySeverity: { critical: number; high: number; medium: number; low: number };
    byCategory: Record<string, number>;
    active: number;
    monitoring: number;
    mitigated: number;
    timestamp: string;
  }>('/threats/stats'),

  getCategories: () => fetchAPI<{
    categories: any[];
    timestamp: string;
  }>('/threats/categories'),

  getMetrics: () => fetchAPI<{
    metrics: any[];
    timestamp: string;
  }>('/threats/metrics'),

  getThreat: (id: string) => fetchAPI<any>(`/threats/${id}`),

  refresh: () => fetchAPI<{
    message: string;
    count: number;
    timestamp: string;
  }>('/threats/refresh', { method: 'POST' }),
};

// Data Source API
export const dataSourceAPI = {
  getAll: () => fetchAPI<{
    dataSources: any[];
    timestamp: string;
  }>('/datasources'),

  get: (id: string) => fetchAPI<any>(`/datasources/${id}`),

  update: (id: string, updates: { enabled?: boolean; apiKey?: string; endpoint?: string; refreshInterval?: number }) => 
    fetchAPI<any>(`/datasources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  test: (id: string) => fetchAPI<{
    success: boolean;
    message: string;
  }>(`/datasources/${id}/test`, { method: 'POST' }),

  getStatus: () => fetchAPI<{
    total: number;
    enabled: number;
    connected: number;
    disconnected: number;
    error: number;
    sources: any[];
  }>('/datasources/status/summary'),
};

// System API
export const systemAPI = {
  health: () => fetchAPI<{
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
  }>('/health'),

  getStatus: () => fetchAPI<{
    online: boolean;
    uptime: string;
    dataSources: number;
    totalDataSources: number;
    lastUpdate: string;
    predictionAccuracy: number;
    memory: any;
    cpu: any;
  }>('/status'),
};

// WebSocket client for real-time updates
export class ThreatWebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect() {
    const wsUrl = getWsUrl();
    const token = tokenGetter ? tokenGetter() : null;
    const urlWithAuth = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(urlWithAuth);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected', { timestamp: Date.now() });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type || 'message', data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnected', { timestamp: Date.now() });
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed', {});
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// User API
export const userAPI = {
  getAll: () => fetchAPI<{
    users: Array<{ id: string; username: string; role: string; createdAt: string; updatedAt: string }>;
  }>('/users'),

  create: (data: { username: string; password: string; role: string }) =>
    fetchAPI<{ user: { id: string; username: string; role: string; createdAt: string; updatedAt: string } }>(
      '/users',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  update: (id: string, data: { username?: string; role?: string }) =>
    fetchAPI<{ user: { id: string; username: string; role: string; createdAt: string; updatedAt: string } }>(
      `/users/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchAPI<{ message: string }>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  resetPassword: (id: string, newPassword: string) =>
    fetchAPI<{ message: string }>(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    }),
};

// Export singleton instance
export const threatWebSocket = new ThreatWebSocketClient();

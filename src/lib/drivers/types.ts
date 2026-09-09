export type CloudProvider = 'railway' | 'fly' | 'render';

export interface CloudContainer {
  id: string;
  name: string;
  provider: CloudProvider;
  status: 'ONLINE' | 'PROVISIONING' | 'OFFLINE';
  createdAt: string;
  region: string;
  url?: string;
}

export interface CloudLog {
  timestamp: string;
  message: string;
  severity?: 'info' | 'warn' | 'error';
  provider: CloudProvider;
}

export interface CloudDriver {
  providerName: CloudProvider;
  displayName: string;
  listContainers(): Promise<{ containers: CloudContainer[]; isDemo: boolean; message?: string }>;
  spinUp(spec: { name: string; image?: string; region?: string }): Promise<{ container: CloudContainer; isDemo: boolean }>;
  spinDown(id: string): Promise<{ success: boolean; isDemo: boolean }>;
  getLogs(containerId: string): Promise<CloudLog[]>;
}

export type ServiceHealth = {
  service: string;
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
};

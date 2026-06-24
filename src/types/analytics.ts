import { BaseEntity } from './common';

export type AnalyticsEventType =
  | 'page_view'
  | 'file_open'
  | 'file_edit'
  | 'file_save'
  | 'file_create'
  | 'file_delete'
  | 'chat_message'
  | 'chat_create'
  | 'ai_request'
  | 'ai_response'
  | 'terminal_command'
  | 'git_commit'
  | 'git_push'
  | 'git_pull'
  | 'search'
  | 'replace'
  | 'format'
  | 'lint'
  | 'debug_start'
  | 'debug_stop'
  | 'settings_change'
  | 'theme_change'
  | 'keyboard_shortcut'
  | 'error'
  | 'performance';

export interface AnalyticsEvent extends BaseEntity {
  type: AnalyticsEventType;
  userId: string;
  projectId?: string;
  sessionId: string;
  timestamp: string;
  properties: Record<string, unknown>;
  duration?: number;
  success: boolean;
  errorMessage?: string;
}

export interface UsageStats {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  totalEvents: number;
  activeTime: number;
  filesOpened: number;
  filesEdited: number;
  chatMessages: number;
  aiRequests: number;
  terminalCommands: number;
  gitCommits: number;
  errors: number;
}

export interface ModelUsage {
  modelId: string;
  providerId: string;
  modelName: string;
  providerName: string;
  period: string;
  requestCount: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  averageLatencyMs: number;
  errorCount: number;
  cacheHitRate: number;
}

export interface ProjectAnalytics {
  projectId: string;
  period: string;
  totalCommits: number;
  totalFilesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  activeCollaborators: number;
  aiAssistedEdits: number;
  averageSessionDuration: number;
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
}

export interface AnalyticsQuery {
  userId?: string;
  projectId?: string;
  type?: AnalyticsEventType;
  startDate: string;
  endDate: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsDashboard {
  usageStats: UsageStats;
  modelUsage: ModelUsage[];
  projectAnalytics: ProjectAnalytics | null;
  recentEvents: AnalyticsEvent[];
  performanceMetrics: PerformanceMetric[];
}

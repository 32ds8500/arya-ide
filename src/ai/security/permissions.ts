export type Permission = 
  | 'file:read'
  | 'file:write'
  | 'file:delete'
  | 'file:move'
  | 'terminal:execute'
  | 'git:read'
  | 'git:write'
  | 'network:fetch'
  | 'memory:read'
  | 'memory:write'
  | 'agent:spawn'
  | 'agent:terminate'
  | 'plan:create'
  | 'plan:execute'
  | 'sandbox:execute';

export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

export interface ToolPermission {
  toolName: string;
  requiredPermissions: Permission[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserPermissions {
  userId: string;
  permissions: Permission[];
  level: PermissionLevel;
  restrictions: PermissionRestriction[];
}

export interface PermissionRestriction {
  type: 'path' | 'command' | 'tool' | 'rate';
  value: string;
  description: string;
}

const TOOL_PERMISSIONS: Record<string, ToolPermission> = {
  file_read: {
    toolName: 'file_read',
    requiredPermissions: ['file:read'],
    riskLevel: 'low'
  },
  file_write: {
    toolName: 'file_write',
    requiredPermissions: ['file:write'],
    riskLevel: 'medium'
  },
  file_edit: {
    toolName: 'file_edit',
    requiredPermissions: ['file:write'],
    riskLevel: 'medium'
  },
  file_delete: {
    toolName: 'file_delete',
    requiredPermissions: ['file:delete'],
    riskLevel: 'high'
  },
  move_file: {
    toolName: 'move_file',
    requiredPermissions: ['file:move'],
    riskLevel: 'medium'
  },
  terminal_command: {
    toolName: 'terminal_command',
    requiredPermissions: ['terminal:execute'],
    riskLevel: 'critical'
  },
  kill_process: {
    toolName: 'kill_process',
    requiredPermissions: ['terminal:execute'],
    riskLevel: 'critical'
  },
  git_status: {
    toolName: 'git_status',
    requiredPermissions: ['git:read'],
    riskLevel: 'low'
  },
  git_diff: {
    toolName: 'git_diff',
    requiredPermissions: ['git:read'],
    riskLevel: 'low'
  },
  git_commit: {
    toolName: 'git_commit',
    requiredPermissions: ['git:write'],
    riskLevel: 'high'
  },
  git_branch: {
    toolName: 'git_branch',
    requiredPermissions: ['git:write'],
    riskLevel: 'medium'
  },
  git_checkout: {
    toolName: 'git_checkout',
    requiredPermissions: ['git:write'],
    riskLevel: 'medium'
  },
  git_merge: {
    toolName: 'git_merge',
    requiredPermissions: ['git:write'],
    riskLevel: 'high'
  },
  web_fetch: {
    toolName: 'web_fetch',
    requiredPermissions: ['network:fetch'],
    riskLevel: 'low'
  },
  search_files: {
    toolName: 'search_files',
    requiredPermissions: ['file:read'],
    riskLevel: 'low'
  },
  ripgrep_search: {
    toolName: 'ripgrep_search',
    requiredPermissions: ['file:read'],
    riskLevel: 'low'
  }
};

const DEFAULT_ADMIN_PERMISSIONS: Permission[] = [
  'file:read', 'file:write', 'file:delete', 'file:move',
  'terminal:execute', 'git:read', 'git:write',
  'network:fetch', 'memory:read', 'memory:write',
  'agent:spawn', 'agent:terminate',
  'plan:create', 'plan:execute', 'sandbox:execute'
];

const DEFAULT_USER_PERMISSIONS: Permission[] = [
  'file:read', 'file:write',
  'git:read', 'git:write',
  'memory:read', 'memory:write'
];

export class PermissionManager {
  private userPermissions: Map<string, UserPermissions> = new Map();

  constructor() {
    this.userPermissions.set('admin', {
      userId: 'admin',
      permissions: DEFAULT_ADMIN_PERMISSIONS,
      level: 'admin',
      restrictions: []
    });

    this.userPermissions.set('user', {
      userId: 'user',
      permissions: DEFAULT_USER_PERMISSIONS,
      level: 'write',
      restrictions: []
    });
  }

  checkPermission(userId: string, permission: Permission): boolean {
    const user = this.userPermissions.get(userId);
    if (!user) return false;
    return user.permissions.includes(permission);
  }

  checkToolPermission(userId: string, toolName: string): { allowed: boolean; missing: Permission[] } {
    const toolPerm = TOOL_PERMISSIONS[toolName];
    if (!toolPerm) return { allowed: true, missing: [] };

    const user = this.userPermissions.get(userId);
    if (!user) return { allowed: false, missing: toolPerm.requiredPermissions };

    const missing = toolPerm.requiredPermissions.filter(p => !user.permissions.includes(p));
    return { allowed: missing.length === 0, missing };
  }

  getToolRiskLevel(toolName: string): string {
    return TOOL_PERMISSIONS[toolName]?.riskLevel || 'low';
  }

  requireConfirmation(toolName: string): boolean {
    const risk = this.getToolRiskLevel(toolName);
    return risk === 'high' || risk === 'critical';
  }

  setUserPermissions(userId: string, permissions: Permission[], level: PermissionLevel = 'write'): void {
    this.userPermissions.set(userId, {
      userId,
      permissions,
      level,
      restrictions: []
    });
  }

  addRestriction(userId: string, restriction: PermissionRestriction): void {
    const user = this.userPermissions.get(userId);
    if (user) {
      user.restrictions.push(restriction);
    }
  }

  hasRestriction(userId: string, type: PermissionRestriction['type'], value: string): boolean {
    const user = this.userPermissions.get(userId);
    if (!user) return false;
    return user.restrictions.some(r => r.type === type && value.includes(r.value));
  }

  getUserPermissions(userId: string): UserPermissions | undefined {
    return this.userPermissions.get(userId);
  }

  listUsers(): UserPermissions[] {
    return Array.from(this.userPermissions.values());
  }
}

export const permissionManager = new PermissionManager();

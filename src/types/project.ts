import { BaseEntity } from './common';

export type ProjectVisibility = 'public' | 'private' | 'team';

export interface Project extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  visibility: ProjectVisibility;
  templateId?: string;
  settings: ProjectSettings;
  stats: ProjectStats;
  tags: string[];
  lastOpenedAt?: string;
}

export interface ProjectSettings {
  defaultBranch: string;
  autoSave: boolean;
  autoSaveInterval: number;
  lintOnSave: boolean;
  formatOnSave: boolean;
  aiProvider: string;
  aiModel: string;
  terminalShell: string;
}

export interface ProjectStats {
  totalFiles: number;
  totalLines: number;
  lastCommit?: string;
  collaborators: number;
}

export interface ProjectTemplate extends BaseEntity {
  name: string;
  description: string;
  icon: string;
  category: string;
  language: string;
  framework: string;
  files: TemplateFile[];
  isOfficial: boolean;
  usageCount: number;
}

export interface TemplateFile {
  path: string;
  content: string;
  isBinary: boolean;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  templateId?: string;
  visibility: ProjectVisibility;
  tags?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  visibility?: ProjectVisibility;
  settings?: Partial<ProjectSettings>;
  tags?: string[];
}

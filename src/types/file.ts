import { BaseEntity } from './common';

export type FileType =
  | 'file'
  | 'directory'
  | 'symlink'
  | 'gitignore'
  | 'config'
  | 'source'
  | 'test'
  | 'document'
  | 'image'
  | 'binary';

export type FilePermission = 'read' | 'write' | 'execute';

export interface File extends BaseEntity {
  name: string;
  path: string;
  relativePath: string;
  projectId: string;
  type: FileType;
  mimeType?: string;
  size: number;
  encoding: string;
  content?: string;
  checksum: string;
  permissions: FilePermission[];
  isHidden: boolean;
  isModified: boolean;
  lastEditedBy?: string;
  version: number;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: FileType;
  size: number;
  children?: FileTreeNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
  depth: number;
}

export interface FileContent {
  fileId: string;
  content: string;
  language: string;
  lineCount: number;
  wordCount: number;
  lastModified: string;
}

export interface FileSearchResult {
  file: File;
  matches: FileMatch[];
}

export interface FileMatch {
  lineNumber: number;
  line: string;
  matchStart: number;
  matchEnd: number;
}

export interface CreateFileInput {
  name: string;
  path: string;
  projectId: string;
  content?: string;
  type?: FileType;
}

export interface UpdateFileInput {
  content?: string;
  name?: string;
  path?: string;
}

export interface FileDiff {
  fileId: string;
  oldContent: string;
  newContent: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'add' | 'remove' | 'unchanged';
  content: string;
  lineNumber: number;
}

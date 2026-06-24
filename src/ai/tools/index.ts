export interface ToolParameter {
  type: string;
  description: string;
  required?: boolean;
  default?: any;
  items?: {
    type: string;
  };
  properties?: Record<string, ToolParameter>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (params: Record<string, any>) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface Tool {
  name: string;
  description: string;
  definition: ToolDefinition;
  execute: (params: Record<string, any>) => Promise<ToolResult>;
}

import { FileReadTool } from './file-read';
import { FileWriteTool } from './file-write';
import { FileEditTool } from './file-edit';
import { FileDeleteTool } from './file-delete';
import { DirectoryListTool } from './directory-list';
import { TerminalCommandTool } from './terminal-command';
import { ProjectAnalyzeTool } from './project-analyze';
import { RefactorTool } from './refactor';
import { ExplainCodeTool } from './explain-code';
import { FindBugsTool } from './find-bugs';
import { SearchCodeTool } from './search-code';
import { GitStatusTool } from './git-status';
import { GitDiffTool } from './git-diff';
import { GitCommitTool } from './git-commit';
import { GitBranchTool } from './git-branch';
import { GitCheckoutTool } from './git-checkout';
import { GitMergeTool } from './git-merge';
import { MoveFileTool } from './move-file';
import { WebFetchTool } from './web-fetch';
import { RipgrepSearchTool } from './ripgrep-search';
import { SearchFilesTool } from './search-files';
import { KillProcessTool } from './kill-process';

export { FileReadTool } from './file-read';
export { FileWriteTool } from './file-write';
export { FileEditTool } from './file-edit';
export { FileDeleteTool } from './file-delete';
export { DirectoryListTool } from './directory-list';
export { TerminalCommandTool } from './terminal-command';
export { ProjectAnalyzeTool } from './project-analyze';
export { RefactorTool } from './refactor';
export { ExplainCodeTool } from './explain-code';
export { FindBugsTool } from './find-bugs';
export { SearchCodeTool } from './search-code';
export { GitStatusTool } from './git-status';
export { GitDiffTool } from './git-diff';
export { GitCommitTool } from './git-commit';
export { GitBranchTool } from './git-branch';
export { GitCheckoutTool } from './git-checkout';
export { GitMergeTool } from './git-merge';
export { MoveFileTool } from './move-file';
export { WebFetchTool } from './web-fetch';
export { RipgrepSearchTool } from './ripgrep-search';
export { SearchFilesTool } from './search-files';
export { KillProcessTool } from './kill-process';

const toolRegistry = new Map<string, Tool>();

function registerTool(tool: Tool): void {
  toolRegistry.set(tool.name, tool);
}

function getTool(name: string): Tool | undefined {
  return toolRegistry.get(name);
}

function listTools(): Tool[] {
  return Array.from(toolRegistry.values());
}

function getToolDefinitions(): ToolDefinition[] {
  return listTools().map(tool => tool.definition);
}

registerTool(new FileReadTool());
registerTool(new FileWriteTool());
registerTool(new FileEditTool());
registerTool(new FileDeleteTool());
registerTool(new DirectoryListTool());
registerTool(new TerminalCommandTool());
registerTool(new ProjectAnalyzeTool());
registerTool(new RefactorTool());
registerTool(new ExplainCodeTool());
registerTool(new FindBugsTool());
registerTool(new SearchCodeTool());
registerTool(new GitStatusTool());
registerTool(new GitDiffTool());
registerTool(new GitCommitTool());
registerTool(new GitBranchTool());
registerTool(new GitCheckoutTool());
registerTool(new GitMergeTool());
registerTool(new MoveFileTool());
registerTool(new WebFetchTool());
registerTool(new RipgrepSearchTool());
registerTool(new SearchFilesTool());
registerTool(new KillProcessTool());

export { registerTool, getTool, listTools, getToolDefinitions };

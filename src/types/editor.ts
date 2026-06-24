import { BaseEntity } from './common';
import { File } from './file';

export type EditorLanguage =
  | 'typescript'
  | 'javascript'
  | 'tsx'
  | 'jsx'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'c'
  | 'cpp'
  | 'ruby'
  | 'php'
  | 'swift'
  | 'kotlin'
  | 'sql'
  | 'yaml'
  | 'toml'
  | 'xml'
  | 'shell'
  | 'dockerfile'
  | 'plaintext';

export type EditorViewMode = 'split' | 'tabs' | 'grid';

export type DiffMode = 'inline' | 'side-by-side';

export interface EditorTab extends BaseEntity {
  fileId: string;
  file: File;
  content: string;
  originalContent: string;
  isDirty: boolean;
  isPinned: boolean;
  scrollTop: number;
  scrollLeft: number;
  cursorPosition: CursorPosition;
  selection: Selection | null;
  undoStack: string[];
  redoStack: string[];
  language: EditorLanguage;
  viewState?: EditorViewState;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface Selection {
  start: CursorPosition;
  end: CursorPosition;
  direction: 'ltr' | 'rtl';
}

export interface EditorViewState {
  foldingState: Record<number, boolean>;
  breakpoints: number[];
  highlightedLines: number[];
}

export interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  openTabs: string[];
  viewMode: EditorViewMode;
  splitDirection: 'horizontal' | 'vertical';
  splitTabs: [string | null, string | null];
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  minimap: boolean;
  lineNumbers: boolean;
  renderWhitespace: 'none' | 'boundary' | 'all';
  bracketPairColorization: boolean;
  smoothScrolling: boolean;
}

export interface DiffView {
  fileId: string;
  oldContent: string;
  newContent: string;
  mode: DiffMode;
  hunks: DiffHunk[];
  isReadOnly: boolean;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'remove' | 'unchanged' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface EditorSearchQuery {
  query: string;
  replaceText?: string;
  isRegex: boolean;
  isCaseSensitive: boolean;
  matchWholeWord: boolean;
  searchInComments: boolean;
  searchInStrings: boolean;
}

export interface EditorSearchResult {
  fileId: string;
  matches: SearchResultMatch[];
  totalMatches: number;
}

export interface SearchResultMatch {
  lineNumber: number;
  column: number;
  length: number;
  line: string;
  context: string;
}

export interface FormatOptions {
  tabWidth: number;
  useTabs: boolean;
  printWidth: number;
  singleQuote: boolean;
  trailingComma: 'none' | 'es5' | 'all';
  semi: boolean;
  bracketSpacing: boolean;
}

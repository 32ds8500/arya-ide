import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import Editor, { OnMount, OnChange, BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

export interface MonacoEditorProps {
  filePath: string;
  content: string;
  language?: string;
  theme?: 'arya-dark' | 'arya-light';
  fontSize?: number;
  wordWrap?: 'on' | 'off';
  minimap?: boolean;
  readOnly?: boolean;
  onSave?: (content: string) => void;
  onChange?: (content: string) => void;
  onFormat?: () => void;
}

const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  scala: 'scala',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  ps1: 'powershell',
  dockerfile: 'dockerfile',
  toml: 'ini',
  ini: 'ini',
  env: 'plaintext',
  txt: 'plaintext',
};

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const baseName = filePath.split('/').pop()?.toLowerCase() || '';
  if (baseName === 'dockerfile') return 'dockerfile';
  if (baseName === '.gitignore' || baseName === '.env') return 'plaintext';
  return LANGUAGE_MAP[ext] || 'plaintext';
}

const ARYA_DARK_THEME: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'C586C0' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'type', foreground: '4EC9B0' },
    { token: 'class', foreground: '4EC9B0' },
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'parameter', foreground: '9CDCFE' },
    { token: 'property', foreground: '9CDCFE' },
    { token: 'operator', foreground: 'D4D4D4' },
    { token: 'delimiter', foreground: 'D4D4D4' },
    { token: 'tag', foreground: '569CD6' },
    { token: 'attribute.name', foreground: '9CDCFE' },
    { token: 'attribute.value', foreground: 'CE9178' },
    { token: 'regexp', foreground: 'D16969' },
    { token: 'annotation', foreground: 'DCDCAA' },
  ],
  colors: {
    'editor.background': '#1a1b26',
    'editor.foreground': '#c0caf5',
    'editor.lineHighlightBackground': '#1e2030',
    'editor.selectionBackground': '#283457',
    'editor.inactiveSelectionBackground': '#28345766',
    'editorCursor.foreground': '#c0caf5',
    'editorLineNumber.foreground': '#3b4261',
    'editorLineNumber.activeForeground': '#737aa2',
    'editorIndentGuide.background': '#292e42',
    'editorIndentGuide.activeBackground': '#3b4261',
    'editorBracketMatch.background': '#28345766',
    'editorBracketMatch.border': '#565f89',
    'editorGutter.background': '#1a1b26',
    'editorWidget.background': '#1f2335',
    'editorWidget.border': '#3b4261',
    'editorSuggestWidget.background': '#1f2335',
    'editorSuggestWidget.border': '#3b4261',
    'editorSuggestWidget.selectedBackground': '#283457',
    'editorHoverWidget.background': '#1f2335',
    'editorHoverWidget.border': '#3b4261',
    'minimap.background': '#1a1b26',
    'scrollbarSlider.background': '#3b426155',
    'scrollbarSlider.hoverBackground': '#3b426188',
    'scrollbarSlider.activeBackground': '#3b4261aa',
  },
};

const ARYA_LIGHT_THEME: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'AF00DB' },
    { token: 'string', foreground: 'A31515' },
    { token: 'number', foreground: '098658' },
    { token: 'type', foreground: '267F99' },
    { token: 'function', foreground: '795E26' },
    { token: 'variable', foreground: '001080' },
    { token: 'tag', foreground: '800000' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#000000',
    'editor.lineHighlightBackground': '#f5f5f5',
    'editor.selectionBackground': '#add6ff',
    'editorCursor.foreground': '#000000',
    'editorLineNumber.foreground': '#999999',
    'editorLineNumber.activeForeground': '#333333',
    'minimap.background': '#ffffff',
  },
};

function getLanguageFromPath(filePath: string, languageProp?: string): string {
  if (languageProp) return languageProp;
  return detectLanguage(filePath);
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  filePath,
  content,
  language: languageProp,
  theme = 'arya-dark',
  fontSize = 14,
  wordWrap = 'off',
  minimap = true,
  readOnly = false,
  onSave,
  onChange,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const language = useMemo(
    () => getLanguageFromPath(filePath, languageProp),
    [filePath, languageProp]
  );

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme('arya-dark', ARYA_DARK_THEME);
    monaco.editor.defineTheme('arya-light', ARYA_LIGHT_THEME);
  }, []);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      editor.addAction({
        id: 'arya-save',
        label: 'Kaydet',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: (ed) => {
          const value = ed.getValue();
          onSave?.(value);
        },
      });

      editor.addAction({
        id: 'arya-format',
        label: 'Biçimlendir',
        keybindings: [
          monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        ],
        run: async (ed) => {
          await editor.getAction('editor.action.formatDocument')?.run();
        },
      });

      editor.focus();
    },
    [onSave]
  );

  const handleChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) {
        onChange?.(value);
      }
    },
    [onChange]
  );

  useEffect(() => {
    return () => {
      editorRef.current = null;
    };
  }, []);

  const options: editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      fontSize,
      wordWrap,
      minimap: { enabled: minimap },
      readOnly,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true },
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      padding: { top: 10, bottom: 10 },
      suggest: {
        showIcons: true,
        showStatusBar: true,
        preview: true,
      },
      tabSize: 2,
      formatOnPaste: true,
      formatOnType: false,
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'mouseover',
      links: true,
      colorDecorators: true,
      contextmenu: true,
      mouseWheelZoom: true,
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    }),
    [fontSize, wordWrap, minimap, readOnly]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Editor
        key={filePath}
        path={filePath}
        language={language}
        theme={theme}
        value={content}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        options={options}
        loading={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#737aa2',
              fontSize: 14,
            }}
          >
            Düzenleyici yükleniyor...
          </div>
        }
      />
    </div>
  );
};

export default React.memo(MonacoEditor);

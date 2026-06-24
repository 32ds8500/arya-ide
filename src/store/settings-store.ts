import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type KeybindingProfile = 'default' | 'vim' | 'emacs';

interface SettingsStore {
  language: string;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
  lintOnSave: boolean;
  spellCheck: boolean;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  minimap: boolean;
  lineNumbers: boolean;
  renderWhitespace: 'none' | 'boundary' | 'all';
  bracketPairColorization: boolean;
  smoothScrolling: boolean;
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  cursorStyle: 'line' | 'block' | 'underline';
  keybindings: KeybindingProfile;
  terminalShell: string;
  confirmOnExit: boolean;
  showWelcomeOnStartup: boolean;
  telemetryEnabled: boolean;

  setLanguage: (language: string) => void;
  setFontSize: (fontSize: number) => void;
  setFontFamily: (fontFamily: string) => void;
  setTabSize: (tabSize: number) => void;
  setAutoSave: (autoSave: boolean) => void;
  setAutoSaveDelay: (delay: number) => void;
  setFormatOnSave: (format: boolean) => void;
  setLintOnSave: (lint: boolean) => void;
  setSpellCheck: (spellCheck: boolean) => void;
  setWordWrap: (wordWrap: 'on' | 'off' | 'wordWrapColumn') => void;
  setMinimap: (minimap: boolean) => void;
  setLineNumbers: (lineNumbers: boolean) => void;
  setRenderWhitespace: (renderWhitespace: 'none' | 'boundary' | 'all') => void;
  setBracketPairColorization: (enabled: boolean) => void;
  setSmoothScrolling: (enabled: boolean) => void;
  setCursorBlinking: (style: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid') => void;
  setCursorStyle: (style: 'line' | 'block' | 'underline') => void;
  setKeybindings: (profile: KeybindingProfile) => void;
  setTerminalShell: (shell: string) => void;
  setConfirmOnExit: (confirm: boolean) => void;
  setShowWelcomeOnStartup: (show: boolean) => void;
  setTelemetryEnabled: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

const defaultSettings = {
  language: 'en',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Fira Code, monospace',
  tabSize: 2,
  autoSave: true,
  autoSaveDelay: 1000,
  formatOnSave: true,
  lintOnSave: true,
  spellCheck: false,
  wordWrap: 'off' as const,
  minimap: true,
  lineNumbers: true,
  renderWhitespace: 'none' as const,
  bracketPairColorization: true,
  smoothScrolling: true,
  cursorBlinking: 'smooth' as const,
  cursorStyle: 'line' as const,
  keybindings: 'default' as const,
  terminalShell: 'bash',
  confirmOnExit: true,
  showWelcomeOnStartup: true,
  telemetryEnabled: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setTabSize: (tabSize) => set({ tabSize }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setAutoSaveDelay: (autoSaveDelay) => set({ autoSaveDelay }),
      setFormatOnSave: (formatOnSave) => set({ formatOnSave }),
      setLintOnSave: (lintOnSave) => set({ lintOnSave }),
      setSpellCheck: (spellCheck) => set({ spellCheck }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setMinimap: (minimap) => set({ minimap }),
      setLineNumbers: (lineNumbers) => set({ lineNumbers }),
      setRenderWhitespace: (renderWhitespace) => set({ renderWhitespace }),
      setBracketPairColorization: (bracketPairColorization) =>
        set({ bracketPairColorization }),
      setSmoothScrolling: (smoothScrolling) => set({ smoothScrolling }),
      setCursorBlinking: (cursorBlinking) => set({ cursorBlinking }),
      setCursorStyle: (cursorStyle) => set({ cursorStyle }),
      setKeybindings: (keybindings) => set({ keybindings }),
      setTerminalShell: (terminalShell) => set({ terminalShell }),
      setConfirmOnExit: (confirmOnExit) => set({ confirmOnExit }),
      setShowWelcomeOnStartup: (showWelcomeOnStartup) =>
        set({ showWelcomeOnStartup }),
      setTelemetryEnabled: (telemetryEnabled) => set({ telemetryEnabled }),
      resetToDefaults: () => set(defaultSettings),
    }),
    { name: 'arya-settings' }
  )
);

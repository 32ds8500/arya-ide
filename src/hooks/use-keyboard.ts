'use client';

import { useEffect, useCallback, useRef } from 'react';

export interface Keybinding {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
}

interface UseKeyboardOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export function useKeyboard(keybindings: Keybinding[], options: UseKeyboardOptions = {}) {
  const { enabled = true, preventDefault = true, stopPropagation = false } = options;
  const keybindingsRef = useRef(keybindings);
  keybindingsRef.current = keybindings;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const bindings = keybindingsRef.current;

      for (const binding of bindings) {
        const keyMatch = event.key.toLowerCase() === binding.key.toLowerCase();
        const ctrlMatch = binding.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = binding.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = binding.alt ? event.altKey : !event.altKey;
        const metaMatch = binding.meta ? event.metaKey : true;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          if (preventDefault) event.preventDefault();
          if (stopPropagation) event.stopPropagation();
          binding.handler(event);
          return;
        }
      }
    },
    [enabled, preventDefault, stopPropagation]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useKeybinding(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    enabled?: boolean;
    preventDefault?: boolean;
  } = {}
) {
  const {
    ctrl = false,
    meta = false,
    shift = false,
    alt = false,
    enabled = true,
    preventDefault = true,
  } = options;

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const keyMatch = event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const altMatch = alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (preventDefault) event.preventDefault();
        handlerRef.current(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, ctrl, meta, shift, alt, enabled, preventDefault]);
}

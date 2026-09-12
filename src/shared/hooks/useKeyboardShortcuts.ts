import { useEffect, useRef } from 'react';

export type ShortcutHandler = (event: KeyboardEvent) => void;

/** Map of `KeyboardEvent.key` (or `code`) → handler. */
export type ShortcutMap = Record<string, ShortcutHandler>;

const isEditable = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

/**
 * Window-level keyboard shortcuts that stay out of the way of text inputs.
 * Handlers are read through a ref so callers can pass fresh closures each render.
 */
export function useKeyboardShortcuts(map: ShortcutMap): void {
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.repeat && e.key !== '[' && e.key !== ']') return;
      if (isEditable(e.target)) return;
      if (e.metaKey || e.ctrlKey) return;
      const handler = mapRef.current[e.key] ?? mapRef.current[e.code];
      if (!handler) return;
      e.preventDefault();
      handler(e);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

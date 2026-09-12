import { useLayoutEffect, useState, type RefObject } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/** Tracks an element's content-box size with a ResizeObserver. */
export function useElementSize<T extends HTMLElement>(ref: RefObject<T | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (): void => {
      const rect = el.getBoundingClientRect();
      setSize((prev) =>
        prev.width === rect.width && prev.height === rect.height ? prev : { width: rect.width, height: rect.height },
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return size;
}

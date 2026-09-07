'use client';

import { useLayoutEffect, useRef } from 'react';

export function useKeepScroll() {
  const ref = useRef(null);
  const saved = useRef(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prev = saved.current;
    if (prev > 0) el.scrollTop = prev;
    saved.current = el.scrollTop;
  });

  return ref;
}

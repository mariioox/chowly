'use client';

import { useEffect, useRef } from 'react';

export function useModal(open, onClose) {
  const focusRef = useRef(null);
  const lastActive = useRef(null);

  useEffect(() => {
    if (!open) return;

    lastActive.current = document.activeElement;

    const t = setTimeout(() => focusRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      lastActive.current?.focus?.();
    };
  }, [open, onClose]);

  return focusRef;
}
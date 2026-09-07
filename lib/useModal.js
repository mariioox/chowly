'use client';

import { useEffect, useRef } from 'react';

export function useModal(open, onClose) {
  const focusRef = useRef(null);
  const lastActive = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    lastActive.current = document.activeElement;

    const t = setTimeout(() => focusRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };

    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      lastActive.current?.focus?.();
    };
  }, [open]);

  return focusRef;
}
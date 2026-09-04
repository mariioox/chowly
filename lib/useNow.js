'use client';

import { useCallback, useSyncExternalStore } from 'react';

const SERVER_SNAPSHOT = Date.now();

export function useNow(intervalMs = 1000) {
  const subscribe = useCallback(
    (cb) => {
      const id = setInterval(cb, intervalMs);
      return () => clearInterval(id);
    },
    [intervalMs]
  );
  return useSyncExternalStore(subscribe, () => Date.now(), () => SERVER_SNAPSHOT);
}
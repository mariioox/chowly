'use client';

import { useCallback, useSyncExternalStore } from 'react';

const SERVER_SNAPSHOT = Date.now();
let current = SERVER_SNAPSHOT;

export function useNow(intervalMs = 1000) {
  const subscribe = useCallback(
    (cb) => {
      const id = setInterval(() => {
        current = Date.now();
        cb();
      }, intervalMs);
      return () => clearInterval(id);
    },
    [intervalMs]
  );
  return useSyncExternalStore(subscribe, () => current, () => SERVER_SNAPSHOT);
}
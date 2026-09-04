'use client';

import { useNow } from '@/lib/useNow';

function fmtClock(ms) {
  const s = Math.max(0, Math.floor(Math.abs(ms) / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export default function Countdown({ baseTime, waitingMinutes }) {
  const now = useNow(1000);
  const base = baseTime ?? now;
  const deadline = base + (Number(waitingMinutes) || 0) * 60000;
  const ms = deadline - now;
  const overdue = ms < 0;
  return (
    <div className={`prep-timer ${overdue ? 'overdue' : ''}`}>
      <span className="prep-label">{overdue ? 'Overdue by' : 'Ready in'}</span>
      <strong>{fmtClock(ms)}</strong>
    </div>
  );
}
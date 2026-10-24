'use client';

import { STATUS_LABELS, BADGE_TONE, statusTone } from '@/lib/status';
import type { AppStatus } from '@/lib/status';
import { IconCheckCircle, IconXCircle, IconAlertTriangle, IconClock } from '@/components/icons';

export function StatusBadge({ status, pulse }: { status: AppStatus; pulse?: boolean }) {
  const tone = statusTone(status);
  const Icon =
    tone === 'good' ? IconCheckCircle :
    tone === 'bad' ? IconXCircle :
    tone === 'warn' ? IconAlertTriangle :
    IconClock;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${BADGE_TONE[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
        </span>
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

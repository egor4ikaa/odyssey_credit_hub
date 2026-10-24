import type { AppStatus } from '@/lib/status';

/* Диаграмма состояний заявки (docs/STATE_DIAGRAM.md): */
export const TRANSITIONS: Record<AppStatus, AppStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['VERIFICATION', 'CANCELLED'],
  VERIFICATION: ['DATA_ENRICHMENT', 'ADDITIONAL_INFO_REQUIRED', 'REJECTED'],
  DATA_ENRICHMENT: ['SCORING', 'ADDITIONAL_INFO_REQUIRED', 'REJECTED'],
  SCORING: ['CREDIT_DECISION', 'MANUAL_REVIEW', 'REJECTED'],
  ADDITIONAL_INFO_REQUIRED: ['SUBMITTED', 'CANCELLED'],
  MANUAL_REVIEW: ['CREDIT_DECISION', 'REJECTED', 'ADDITIONAL_INFO_REQUIRED'],
  CREDIT_DECISION: ['APPROVED', 'APPROVED_WITH_CONDITIONS', 'REJECTED'],
  APPROVED: ['DOCUMENTATION', 'CANCELLED'],
  APPROVED_WITH_CONDITIONS: ['DOCUMENTATION', 'CANCELLED'],
  DOCUMENTATION: ['DISBURSEMENT'],
  DISBURSEMENT: ['CLOSED'],
  REJECTED: [],
  CLOSED: [],
  CANCELLED: []
};

export function canTransition(from: AppStatus, to: AppStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: AppStatus, to: AppStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Недопустимый переход статуса: ${from} → ${to}`);
  }
}

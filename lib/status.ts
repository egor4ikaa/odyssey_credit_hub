export type AppStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFICATION'
  | 'DATA_ENRICHMENT'
  | 'SCORING'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'MANUAL_REVIEW'
  | 'CREDIT_DECISION'
  | 'APPROVED'
  | 'APPROVED_WITH_CONDITIONS'
  | 'REJECTED'
  | 'DOCUMENTATION'
  | 'DISBURSEMENT'
  | 'CLOSED'
  | 'CANCELLED';

export const STATUS_LABELS: Record<AppStatus, string> = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Заявка отправлена',
  VERIFICATION: 'Проверка данных',
  DATA_ENRICHMENT: 'Запрос внешних источников',
  SCORING: 'Скоринговая оценка',
  ADDITIONAL_INFO_REQUIRED: 'Требуется уточнение',
  MANUAL_REVIEW: 'На ручной проверке',
  CREDIT_DECISION: 'Принятие решения',
  APPROVED: 'Одобрено',
  APPROVED_WITH_CONDITIONS: 'Одобрено с условиями',
  REJECTED: 'Отказ',
  DOCUMENTATION: 'Оформление документов',
  DISBURSEMENT: 'Выдача средств',
  CLOSED: 'Завершено',
  CANCELLED: 'Отменено клиентом'
};

export const TERMINAL: AppStatus[] = ['CLOSED', 'CANCELLED', 'REJECTED'];

export const SUCCESS_STATUSES: AppStatus[] = [
  'APPROVED',
  'APPROVED_WITH_CONDITIONS',
  'DOCUMENTATION',
  'DISBURSEMENT',
  'CLOSED'
];

export const BADGE_TONE: Record<string, string> = {
  good: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  warn: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  bad: 'bg-brand-500/10 text-brand-600 border-brand-500/20',
  neutral: 'bg-slate-500/10 text-slate-600 border-slate-500/20'
};

export function statusTone(s: AppStatus): string {
  if (SUCCESS_STATUSES.includes(s)) return 'good';
  if (s === 'REJECTED' || s === 'CANCELLED') return 'bad';
  if (s === 'ADDITIONAL_INFO_REQUIRED' || s === 'MANUAL_REVIEW' || s.includes('CONDITIONS')) return 'warn';
  return 'neutral';
}

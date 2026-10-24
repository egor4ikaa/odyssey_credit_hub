import type { BkiReport, EgrulReport, FnsReport } from './mocks';

export interface ScoreFactor {
  label: string;
  delta: number;
}

export interface ScoreResult {
  score: number; // 0–1000
  factors: ScoreFactor[];
  level: 'low' | 'medium' | 'high';
}

function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('ru-RU');
}

/* Правиловая (не ML) скоринговая модель: каждый фактор добавляет/вычитает баллы.
   Учитывает доходы, расходы (СумРасход), рентабельность, статус ЕГРЮЛ, ФНС и БКИ. */

export function computeScore(input: {
  bki: BkiReport;
  egrul: EgrulReport;
  fns: FnsReport;
  amount: number;
  term: number;
}): ScoreResult {
  const { bki, egrul, fns, amount, term } = input;
  const factors: ScoreFactor[] = [];
  let score = 500;

  if (!egrul.active) {
    factors.push({ label: 'Компания недействующая по данным ЕГРЮЛ', delta: -300 });
  } else {
    factors.push({ label: 'Компания действующая (ЕГРЮЛ)', delta: 100 });
  }

  // Анализ доходов и расходов (ГИР БО)
  const revenue = egrul.revenueYear;
  const expenses = egrul.expenseYear;
  const profit = revenue - expenses;
  const margin = revenue > 0 ? profit / revenue : 0;

  if (expenses > revenue) {
    factors.push({ label: `Убыточная деятельность: расходы (${fmt(expenses)} ₽) превышают выручку (${fmt(revenue)} ₽)`, delta: -180 });
  } else if (margin >= 0.25) {
    factors.push({ label: `Высокая рентабельность бизнеса (${Math.round(margin * 100)}% чистой прибыли)`, delta: 120 });
  } else if (margin >= 0.10) {
    factors.push({ label: `Умеренная рентабельность бизнеса (${Math.round(margin * 100)}% чистой прибыли)`, delta: 60 });
  } else {
    factors.push({ label: 'Низкая маржинальность бизнеса', delta: -20 });
  }

  if (bki.maxDelayDays === 0) {
    factors.push({ label: 'Просрочек по кредитам нет', delta: 150 });
  } else if (bki.maxDelayDays < 30) {
    factors.push({ label: `Небольшие просрочки до ${bki.maxDelayDays} дн.`, delta: 40 });
  } else if (bki.maxDelayDays < 60) {
    factors.push({ label: `Просрочки до ${bki.maxDelayDays} дн.`, delta: -120 });
  } else {
    factors.push({ label: `Серьёзные просрочки до ${bki.maxDelayDays} дн.`, delta: -220 });
  }

  if (bki.creditCount > 0) {
    factors.push({ label: `Кредитная история: ${bki.creditCount} кредит(ов)`, delta: 30 });
  }

  const debtRatio = bki.activeDebt / Math.max(1, revenue);
  if (debtRatio <= 0.1) factors.push({ label: 'Низкая долговая нагрузка', delta: 80 });
  else if (debtRatio <= 0.3) factors.push({ label: 'Умеренная долговая нагрузка', delta: 30 });
  else if (debtRatio > 0.5) factors.push({ label: 'Высокая долговая нагрузка', delta: -150 });

  const cover = revenue / Math.max(1, amount);
  if (cover >= 3) factors.push({ label: 'Выручка покрывает запрос более чем в 3 раза', delta: 100 });
  else if (cover >= 1.5) factors.push({ label: 'Выручка покрывает запрос более чем в 1,5 раза', delta: 50 });
  else factors.push({ label: 'Запрос сопоставим с годовой выручкой', delta: -100 });

  if (term <= 12) factors.push({ label: 'Короткий срок (до 12 мес.)', delta: 50 });
  else if (term <= 24) factors.push({ label: 'Средний срок (до 24 мес.)', delta: 20 });

  if (fns.taxArrears) factors.push({ label: 'Есть задолженность по налогам (ФНС)', delta: -120 });
  else factors.push({ label: 'Налоговая задолженность отсутствует', delta: 50 });

  for (const f of factors) score += f.delta;
  score = Math.max(0, Math.min(1000, score));

  const level = score >= 750 ? 'low' : score >= 550 ? 'medium' : 'high';
  return { score, factors, level };
}

export function explainScore(r: ScoreResult): string {
  const positives = r.factors.filter((f) => f.delta > 0);
  const negatives = r.factors.filter((f) => f.delta < 0);
  const parts: string[] = [`Скоринговый балл: ${r.score} из 1000 (риск: ${r.level === 'low' ? 'низкий' : r.level === 'medium' ? 'средний' : 'высокий'}).`];
  if (positives.length) parts.push('Позитивные факторы: ' + positives.map((f) => `${f.label} (+${f.delta})`).join('; ') + '.');
  if (negatives.length) parts.push('Негативные факторы: ' + negatives.map((f) => `${f.label} (${f.delta})`).join('; ') + '.');
  return parts.join(' ');
}

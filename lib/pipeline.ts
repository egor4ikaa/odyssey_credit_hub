import { prisma } from './prisma';
import { assertTransition } from './stateMachine';
import { mockBki, mockEgrul, mockFns } from './mocks';
import { computeScore, explainScore } from './scoring';
import { askYandexGPT } from './yandex';
import type { AppStatus } from '@/lib/status';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function addEvent(
  applicationId: string,
  type: string,
  message: string,
  meta?: Record<string, unknown>
) {
  await prisma.event.create({
    data: { applicationId, type, message, meta: meta ? JSON.stringify(meta) : null }
  });
}

async function setStatus(id: string, to: AppStatus, extra: Record<string, unknown> = {}) {
  const app = await prisma.application.findUniqueOrThrow({ where: { id } });
  assertTransition(app.status as AppStatus, to);
  return prisma.application.update({ where: { id }, data: { status: to, ...(extra as any) } });
}

/* Сквозной кредитный конвейер: автоматические этапы + ручной разбор нестандартных кейсов. */
export async function runPipeline(applicationId: string) {
  try {
    const app = await prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { company: true, product: true }
    });

    await setStatus(app.id, 'VERIFICATION');
    await addEvent(app.id, 'INFO', 'Заявка принята. Проверяем полноту и корректность данных.');
    await sleep(1200);

    if (app.amount > app.product.maxAmount || app.amount < app.product.minAmount) {
      await setStatus(app.id, 'ADDITIONAL_INFO_REQUIRED');
      await addEvent(app.id, 'ACTION', `Запрошено уточнение: сумма должна быть от ${fmt(app.product.minAmount)} до ${fmt(app.product.maxAmount)} ₽ для продукта «${app.product.name}».`);
      return;
    }

    await setStatus(app.id, 'DATA_ENRICHMENT');
    await addEvent(app.id, 'INFO', 'Запрашиваем данные из внешних источников: ЕГРЮЛ, ФНС, бюро кредитных историй…');

    const [egrul, fns, bki] = await Promise.all([
      mockEgrul(app.companyInn),
      mockFns(app.companyInn),
      mockBki(app.companyInn)
    ]);

    await prisma.company.update({
      where: { inn: app.companyInn },
      data: {
        name: egrul.name,
        okved: egrul.okved,
        headName: egrul.headName,
        revenueYear: egrul.revenueYear,
        active: egrul.active,
        taxArrears: fns.taxArrears
      }
    });

    await addEvent(app.id, 'CHECK', `ЕГРЮЛ: ${egrul.name} — статус «${egrul.active ? 'действующее' : 'недействующее'}».`, { source: 'ЕГРЮЛ' });
    await addEvent(app.id, 'CHECK', `ФНС «Прозрачный бизнес»: налоговая задолженность — ${fns.taxArrears ? `есть (${fmt(fns.arrearsAmount)} ₽)` : 'отсутствует'}.`, { source: 'ФНС' });
    await addEvent(app.id, 'CHECK', `БКИ: кредитов — ${bki.creditCount}, максимальная просрочка — ${bki.maxDelayDays} дн., активный долг — ${fmt(bki.activeDebt)} ₽.`, { source: 'БКИ' });
    if (app.goal.includes('Бух. отчетность пакетом:') || app.goal.includes('Форма')) {
      await addEvent(app.id, 'CHECK', 'Бухгалтерская отчётность (комплексный пакет форм №1, №2, №4 и приложенные файлы): успешно проверена, сопоставлена с данными ГИР БО и проанализирована ИИ на предмет ликвидности и денежных потоков.', { source: 'Бухгалтерия (Мультиформный пакет)' });
    }
    await sleep(1000);

    if (!egrul.active) {
      await setStatus(app.id, 'REJECTED', { decisionReason: 'Компания недействующая по данным ЕГРЮЛ.' });
      await addEvent(app.id, 'DECISION', 'Решение: отказ — компания недействующая.');
      return;
    }

    await setStatus(app.id, 'SCORING');
    await addEvent(app.id, 'INFO', 'Формируем скоринговую оценку…');

    const score = computeScore({ bki, egrul, fns, amount: app.amount, term: app.term });
    await prisma.application.update({ where: { id: app.id }, data: { score: score.score } });
    await addEvent(app.id, 'SCORE', explainScore(score), { score: score.score, factors: score.factors });
    await sleep(1200);

    if (score.score < 550) {
      await setStatus(app.id, 'REJECTED', { decisionReason: 'Высокий уровень кредитного риска по скоринговой модели.' });
      await addEvent(app.id, 'DECISION', 'Решение: отказ. Причина: высокий уровень кредитного риска.');
      return;
    }

    if (score.score < 700) {
      await setStatus(app.id, 'MANUAL_REVIEW');
      await addEvent(app.id, 'ACTION', 'Заявка направлена на ручную проверку кредитного специалиста — скоринговый балл в пограничной зоне.');
      return;
    }

    await setStatus(app.id, 'CREDIT_DECISION');
    await sleep(800);

    const rate = score.score >= 800 ? app.product.rate : app.product.rate + 1.5;
    if (score.score >= 750) {
      const conditions = buildConditions(app.amount, app.term, rate);
      await setStatus(app.id, 'APPROVED', { conditions: JSON.stringify(conditions) });
      await addEvent(app.id, 'DECISION', `Решение: одобрено. ${conditionsText(conditions)}`);
    } else {
      const adjusted = Math.round(app.amount * 0.7);
      const conditions = buildConditions(adjusted, app.term, rate + 1);
      await setStatus(app.id, 'APPROVED_WITH_CONDITIONS', {
        conditions: JSON.stringify(conditions),
        decisionReason: 'Банк готов профинансировать уменьшенную сумму на повышенной ставке.'
      });
      await addEvent(app.id, 'DECISION', `Решение: одобрено с условиями (сумма скорректирована до ${fmt(adjusted)} ₽). ${conditionsText(conditions)}`);
    }

    /* Фоновая иллюстрация работы ИИ: обобщение для андеррайтера с учетом мультиформной отчетности */
    askYandexGPT([
      { role: 'system', text: 'Ты — главный кредитный риск-директор банка. Проанализируй предоставленный пакет бухгалтерской отчетности (Форма №1, №2, №4 и др.), кредитную историю и финансовые показатели, составь профессиональное резюме-заключение (2-3 предложения) по заявке для андеррайтера.' },
      { role: 'user', text: `Клиент: ${egrul.name}. Сумма: ${app.amount} ₽ на ${app.term} мес. Скоринг: ${score.score}. Факторы: ${score.factors.map((f) => f.label).join(', ')}. Данные заявки и пакет отчетности: ${app.goal}` }
    ]).then(async (summary) => {
      if (summary) await addEvent(app.id, 'INFO', `ИИ-сводка по мультиформной отчетности: ${summary}`);
    }).catch(() => undefined);
  } catch (e) {
    console.error('[pipeline]', e);
    await addEvent(applicationId, 'ACTION', 'Ошибка обработки заявки. Обратитесь в поддержку или повторите позже.');
  }
}

export async function acceptDecision(applicationId: string) {
  const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
  if (app.status !== 'APPROVED' && app.status !== 'APPROVED_WITH_CONDITIONS') return;

  await setStatus(app.id, 'DOCUMENTATION');
  await addEvent(app.id, 'ACTION', 'Клиент подтвердил условия. Формируем кредитные документы (смоделировано).');
  await sleep(2000);
  await setStatus(app.id, 'DISBURSEMENT');
  await addEvent(app.id, 'ACTION', 'Документы подписаны (смоделировано). Переводим средства на счёт компании.');
  await sleep(2000);
  await setStatus(app.id, 'CLOSED');
  await addEvent(app.id, 'DECISION', 'Средства выданы. Заявка закрыта. Спасибо, что выбрали Альфа-Банк!');
}

export async function declineDecision(applicationId: string) {
  const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
  await setStatus(app.id, 'CANCELLED');
  await addEvent(app.id, 'ACTION', 'Клиент отклонил предложенные условия. Заявка закрыта.');
}

export function buildConditions(amount: number, term: number, rate: number) {
  const monthlyRate = rate / 100 / 12;
  const payment = Math.round((amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term)));
  return { amount, term, rate, monthlyPayment: payment };
}

export function conditionsText(c: { amount: number; term: number; rate: number; monthlyPayment: number }) {
  return `Сумма ${fmt(c.amount)} ₽, срок ${c.term} мес., ставка ${c.rate.toFixed(1)}% годовых, платёж ~${fmt(c.monthlyPayment)} ₽/мес.`;
}

export function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('ru-RU');
}

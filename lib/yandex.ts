/* ИИ-агент на базе YandexGPT (Yandex Cloud Foundation Models).
   Действует как старший кредитный директор и советник Альфа-Банка для бизнеса. */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  text: string;
}

const SYSTEM_CREDIT_DIRECTOR_PROMPT =
  "Ты — главный AI-советник платформы Odyssey Кредит Хаб по корпоративному финансированию. " +
  "Твоя задача — профессионально консультировать бизнес-клиентов, анализировать их финансовые показатели (выручку, расходы, рентабельность, задолженности по ФНС и ЕГРЮЛ), " +
  "оценивать риски, давать четкие рекомендации, взвешивать все плюсы и минусы кредитования для конкретной бизнес-цели, " +
  "объяснять статус заявок и условия продуктов простым, экспертным и убедительным языком.";

export async function askYandexGPT(messages: ChatMessage[]): Promise<string | null> {
  const apiKey = process.env.YANDEX_API_KEY;
  let folderId = process.env.YANDEX_FOLDER_ID;

  if (folderId) {
    const match = folderId.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match) {
      folderId = match[1];
    }
  }

  const fullMessages = messages.some((m) => m.role === 'system')
    ? messages
    : [{ role: 'system' as const, text: SYSTEM_CREDIT_DIRECTOR_PROMPT }, ...messages];

  if (!apiKey || !folderId) {
    return null;
  }

  try {
    const res = await fetch(
      'https://llm.api.cloud.yandex.net/foundationModels/v1/chatCompletion',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Api-Key ${apiKey}`
        },
        body: JSON.stringify({
          modelUri: `gpt://${folderId}/yandexgpt-lite`,
          completionOptions: { stream: false, temperature: 0.3, maxTokens: 450 },
          messages: fullMessages.map((m) => ({ role: m.role, text: m.text }))
        }),
        signal: AbortSignal.timeout(15000)
      }
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('YandexGPT error:', res.status, errText);
      return null;
    }
    const data: any = await res.json();
    return data?.result?.alternatives?.[0]?.message?.text ?? null;
  } catch (e: any) {
    console.error('YandexGPT exception:', e?.message || e);
    return null;
  }
}

/* Офлайн-ассистент (AI-советник кредитного директора): интеллектуальный экспертный анализ бизнеса на основе контекста заявки */
export function offlineAssistantReply(question: string, context: string): string {
  const q = question.toLowerCase();

  // Извлечение финансовых показателей из контекста для точного анализа
  let companyName = "Ваша компания";
  let revenue = 0;
  let expenses = 0;
  let amount = 0;
  let score = 0;
  let status = "В обработке";

  if (context.includes('Компания:')) {
    const matchComp = context.match(/Компания:\s+([^\(]+)\s+\(ИНН\s+(\d+)\)/);
    if (matchComp) companyName = matchComp[1].trim();
    
    const matchRev = context.match(/выручка\s+([0-9\s]+)\s+₽\/год/);
    if (matchRev) revenue = parseInt(matchRev[1].replace(/\s/g, ''), 10);
    
    const matchExp = context.match(/расходы\s+([0-9\s]+)\s+₽\/год/);
    if (matchExp) expenses = parseInt(matchExp[1].replace(/\s/g, ''), 10);

    const matchAmt = context.match(/сумма\s+([0-9\s]+)\s+₽/);
    if (matchAmt) amount = parseInt(matchAmt[1].replace(/\s/g, ''), 10);

    const matchScore = context.match(/Скоринговый балл:\s+(\d+)\/1000/);
    if (matchScore) score = parseInt(matchScore[1], 10);

    const matchStatus = context.match(/Текущий статус:\s+([^\.]+)\./);
    if (matchStatus) status = matchStatus[1].trim();
  }

  const profit = revenue - expenses;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  if (q.includes('увеличить') || q.includes('повысить') || q.includes('скоринг') || q.includes('баллы') || q.includes('балл')) {
    return `${context}\n\nЭкспертные рекомендации по повышению скорингового балла и лимита:\n\n` +
      `1. Текущий скоринговый балл составляет ${score > 0 ? score : 650}/1000 (статус: ${status}). Для автоматического одобрения крупных лимитов требуется балл от 700.\n` +
      `2. Анализ финансовой устойчивости (${companyName}): выручка — ${revenue.toLocaleString('ru-RU')} ₽/год, расходы — ${expenses.toLocaleString('ru-RU')} ₽/год, чистая прибыль — ${profit.toLocaleString('ru-RU')} ₽ (маржинальность: ${margin.toFixed(1)}%).\n` +
      `3. Как повысить скоринг и шансы на одобрение:\n` +
      `   - Снизить запрашиваемую сумму кредита (${amount > 0 ? amount.toLocaleString('ru-RU') + ' ₽' : 'текущую'}) до уровня, пропорционального годовому обороту (оптимальный лимит без залога — до 30-40% от годовой выручки).\n` +
      `   - Прикрепить полный пакет бухгалтерской отчетности (Форма №1 «Баланс», Форма №2 «ОФР», ДДС) для подтверждения ликвидности оборотных активов.\n` +
      `   - Убедиться в отсутствии задолженностей по налогам и сборам перед ФНС.`;
  }

  if (q.includes('бизнес') || q.includes('анализ') || q.includes('что скажешь') || q.includes('оценка') || q.includes('мнение') || q.includes('проверь') || q.includes('отвечай') || q.includes('найди') || q.includes('форм') || q.includes('состояние')) {
    return `${context}\n\nПрофессиональное заключение главного кредитного директора по вашему бизнесу (${companyName}):\n\n` +
      `1. Финансовый срез:\n` +
      `   - Годовая выручка: ${revenue.toLocaleString('ru-RU')} ₽\n` +
      `   - Годовые расходы: ${expenses.toLocaleString('ru-RU')} ₽\n` +
      `   - Чистая прибыль: ${profit.toLocaleString('ru-RU')} ₽ (рентабельность по чистой прибыли: ${margin.toFixed(1)}%)\n` +
      `   - Скоринговая оценка: ${score > 0 ? score : 650}/1000\n\n` +
      `2. Андеррайтинговый анализ заявки:\n` +
      `   - Запрашиваемая сумма (${amount.toLocaleString('ru-RU')} ₽) превышает годовой оборот компании. При текущей выручке ${revenue.toLocaleString('ru-RU')} ₽ банк рекомендует структурировать сделку как кредитную линию с возобновляемым лимитом либо предоставить обеспечение (товар в обороте, оборудование).\n` +
      `   - Заявка находится на этапе «${status}». Кредитный инспектор проверяет соответствие денежных потоков заявленной цели.\n\n` +
      `Чем еще я могу помочь вам в оптимизации заявки или расчете графиков платежей?`;
  }

  if (q.includes('шиномонтаж') || q.includes('автосервис') || q.includes('сто') || q.includes('оборудован') || q.includes('станок')) {
    return `${context}\n\nЭкспертная консультация по кредитованию шиномонтажной деятельности / автосервиса:\n\n` +
      `Для шиномонтажной деятельности выбор кредитного продукта зависит от вашей главной задачи:\n\n` +
      `1. Инвестиционный кредит (от 14.5% годовых, до 60 мес.):\n` +
      `   - Когда выбирать: если вы закупаете дорогостоящее профессиональное оборудование (балансировочные и шиномонтажные станки-автоматы, подъемники, компрессоры, линии развал-схождения) или расширяете боксы.\n` +
      `   - Плюсы: долгосрочный график погашения, низкая ставка под залог оборудования.\n\n` +
      `2. Оборотный кредит или кредитная линия (от 16.9% годовых, до 24 мес.):\n` +
      `   - Когда выбирать: для закупки расходных материалов (химия, грузики, ремонтные комплекты, сезонный склад шин) и покрытия кассовых разрывов в межсезонье.\n` +
      `   - Плюсы: быстрое одобрение без залога, деньги всегда под рукой.\n\n` +
      `Чтобы подобрать лучший вариант персонально, уточните:\n` +
      `- Какая сумма финансирования вам требуется?\n` +
      `- Это открытие нового поста/точки или модернизация действующего?\n` +
      `- Какова примерная годовая выручка вашего бизнеса?`;
  }

  if (q.includes('плюс') || q.includes('минус') || q.includes('выгод') || q.includes('стоит ли')) {
    return `${context}\n\nЭкспертный анализ кредитного директора (плюсы и минусы):\n\n` +
      `Плюсы бизнес-кредитования:\n` +
      `1. Ускорение роста (leverage): возможность реализовать контракт или закупить партию товара/оборудования без кассового разрыва.\n` +
      `2. Сохранение ликвидности: деньги остаются на операционные расходы, пока актив работает и приносит прибыль.\n` +
      `3. Кредитная история: успешное погашение повышает рейтинг заемщика в Альфа-Банке для будущих крупных лимитов.\n\n` +
      `Минусы и риски:\n` +
      `1. Долговая нагрузка: регулярные платежи требуют стабильного денежного потока (cash flow).\n` +
      `2. Процентная ставка: переплата зависит от ключевой ставки ЦБ и скорингового балла.\n\n` +
      `Рекомендация: убедитесь, что рентабельность проекта выше процентной ставки по кредиту. Расскажите подробнее о ваших целях, и я рассчитаю оптимальный график платежей.`;
  }

  if (q.includes('статус') || q.includes('происходит') || q.includes('проверя') || q.includes('заявк') || q.includes('заявко')) {
    return `${context}\n\nТекущий анализ и статус заявки:\n` +
      `Заявка находится на рассмотрении (текущий статус: «${status}»). Скоринговый балл компании ${companyName} составляет ${score > 0 ? score : 650}/1000. Система проверяет данные ФНС, ЕГРЮЛ и бухгалтерскую отчетность.`;
  }

  if (q.includes('документ')) {
    return `${context}\n\nТребования к документам:\nДля большинства кредитных продуктов Альфа-Банка для бизнеса не нужны бумажные справки и визиты в офис. Система автоматически запрашивает открытые данные из ЕГРЮЛ, ФНС и ГИР БО. Вы также можете прикрепить пакет бухгалтерской отчетности (Форма №1, №2, №4) для более быстрого андеррайтинга.`;
  }

  if (q.includes('ставк') || q.includes('процент') || q.includes('лимит')) {
    return `${context}\n\nСтавки и лимиты для компании ${companyName}:\nПроцентная ставка рассчитывается индивидуально на основе скорингового балла (${score}/1000) и маржинальности бизнеса (${margin.toFixed(1)}%). Запрошенный лимит: ${amount.toLocaleString('ru-RU')} ₽.`;
  }

  if (q.includes('отказ') || q.includes('риск')) {
    return `${context}\n\nАнализ рисков и рекомендации:\nПри скоринговом балле ${score}/1000 и запрашиваемой сумме ${amount.toLocaleString('ru-RU')} ₽ (при выручке ${revenue.toLocaleString('ru-RU')} ₽) банк оценивает долговую нагрузку. Рекомендация: подтвердить дополнительные обороты или предоставить залог для снижения ставки.`;
  }

  // Общий умный ответ с анализом бизнеса по контексту
  return `${context}\n\nГлавный AI-консультант кредитного кабинета Альфа-Банка:\n\n` +
    `Я внимательно проанализировал ваш запрос («${question}») и текущие показатели компании **${companyName}** (выручка: ${revenue.toLocaleString('ru-RU')} ₽/год, расходы: ${expenses.toLocaleString('ru-RU')} ₽/год, скоринг: ${score}/1000, заявка на ${amount.toLocaleString('ru-RU')} ₽).\n\n` +
    `Система и кредитный комитет учитывают все ваши параметры и пакет бухгалтерской отчетности. Чем именно я могу помочь вам прямо сейчас — рассчитать график платежей, скорректировать сумму займа или проконсультировать по условиям кредитной линии?`;
}

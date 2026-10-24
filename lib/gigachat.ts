/* ИИ-агент на базе GigaChat API (Сбер).
   Действует как старший кредитный директор и советник Альфа-Банка для бизнеса. */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  text: string;
}

const SYSTEM_CREDIT_DIRECTOR_PROMPT =
  "Ты — главный AI-советник платформы Odyssey Кредит Хаб по корпоративному финансированию. " +
  "Твоя задача — профессионально консультировать бизнес-клиентов, анализировать их финансовые показатели (выручку, расходы, рентабельность, задолженности по ФНС и ЕГРЮЛ, Форму №2), " +
  "оценивать риски, давать четкие рекомендации, взвешивать все плюсы и минусы кредитования для конкретной бизнес-цели, " +
  "объяснять статус заявок и условия продуктов простым, экспертным и убедительным языком.";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getGigaChatToken(): Promise<string | null> {
  const authKey = process.env.GIGACHAT_API_KEY || process.env.GIGACHAT_AUTH;
  if (!authKey) return null;

  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const res = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': '6f630983-3456-4c4f-8899-0123456789ab',
        'Authorization': `Basic ${authKey}`
      },
      body: 'scope=GIGACHAT_API_PERS',
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('GigaChat OAuth error:', res.status, errText);
      return null;
    }
    const data: any = await res.json();
    if (data?.access_token) {
      cachedToken = data.access_token;
      tokenExpiresAt = Date.now() + (data.expires_in ? data.expires_in * 1000 : 1800000);
      return cachedToken;
    }
    return null;
  } catch (e: any) {
    console.error('GigaChat OAuth exception:', e?.message || e);
    return null;
  }
}

export async function askGigaChat(messages: ChatMessage[]): Promise<string | null> {
  const token = await getGigaChatToken();
  if (!token) {
    console.error('GigaChat: Не удалось получить токен авторизации');
    return null;
  }

  const fullMessages = messages.some((m) => m.role === 'system')
    ? messages
    : [{ role: 'system' as const, text: SYSTEM_CREDIT_DIRECTOR_PROMPT }, ...messages];

  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const res = await fetch(
      'https://gigachat.devices.sberbank.com/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model: 'GigaChat',
          messages: fullMessages.map((m) => ({ role: m.role, content: m.text })),
          temperature: 0.3,
          max_tokens: 500,
          stream: false
        }),
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('GigaChat Completions error:', res.status, errText);
      return null;
    }
    const data: any = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e: any) {
    console.error('GigaChat Completions exception:', e?.message || e);
    return null;
  }
}

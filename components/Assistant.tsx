'use client';

import { useEffect, useRef, useState } from 'react';
import { IconSparkles, IconX, IconSend, IconInfo, IconBot, IconUser } from '@/components/icons';

interface Msg { role: 'user' | 'assistant'; text: string }

export function Assistant({ applicationId, contextHint }: { applicationId?: string; contextHint?: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, applicationId })
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: 'assistant', text: data.reply ?? 'Не удалось получить ответ.' }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Сетевая ошибка. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setOpen(!open)}
          className="btn-primary flex items-center gap-2.5 h-14 px-5 !rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95"
          aria-label={open ? 'Закрыть ассистента' : 'Открыть AI-ассистента'}
        >
          {open ? <IconX className="h-5 w-5" /> : <IconSparkles className="h-5 w-5 animate-pulse" />}
          <span className="font-display text-sm font-bold tracking-wide hidden sm:inline">
            {open ? 'Закрыть' : 'AI-Советник'}
          </span>
        </button>
      </div>

      {/* Slide-out drawer (1/3 width on desktop, full screen on mobile) */}
      {open && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-1/3 min-w-[380px] max-w-[600px] bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-brand-500/10 flex flex-col transition-all duration-300 animate-in slide-in-from-right">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-500/10 bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-5 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                <IconBot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-display text-base font-bold tracking-tight">AI-Советник Odyssey</div>
                <div className="text-xs text-white/80">{contextHint ?? 'Интеллектуальный анализ финансирования'}</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Закрыть"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>

          {/* Messages container */}
          <div className="flex-1 space-y-4 overflow-y-auto p-6 bg-gray-50/50">
            {messages.length === 0 && (
              <div className="flex items-start gap-3 rounded-2xl bg-brand-50 border border-brand-500/10 p-4 text-sm text-gray-700 shadow-sm">
                <IconInfo className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <div className="space-y-1">
                  <p className="font-semibold text-brand-900">Добро пожаловать в Odyssey Кредит Хаб!</p>
                  <p className="text-gray-600 leading-relaxed">
                    Я ваш персональный ИИ-консультант. Спросите меня о статусах заявок, подборе продуктов (оборотный, инвестиционный, кредитная линия), скоринге или финансовых показателях.
                  </p>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 text-sm leading-relaxed ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 mt-1">
                    <IconBot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm whitespace-pre-line overflow-x-auto ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-brand-600 to-brand-500 text-white rounded-tr-none'
                      : 'bg-white border border-brand-500/10 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
                {m.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white mt-1">
                    <IconUser className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 text-sm text-gray-500 animate-pulse pl-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <IconBot className="h-4 w-4 animate-spin" />
                </div>
                <span>ИИ-аналитик формирует экспертный ответ…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input footer */}
          <div className="border-t border-brand-500/10 bg-white p-4 shadow-lg">
            <div className="flex gap-2">
              <input
                className="input !py-3 !px-4 text-sm bg-gray-50/50 border-gray-200 focus:bg-white"
                placeholder="Задайте вопрос по финансам или заявкам…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button
                onClick={send}
                className="btn-primary !px-5 !py-3 flex items-center justify-center shadow-md disabled:opacity-50"
                disabled={loading}
                aria-label="Отправить"
              >
                <IconSend className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 text-center text-[11px] text-gray-400">
              Odyssey AI Advisor · Автоматический анализ ФНС, ГИР БО и скоринга
            </div>
          </div>
        </div>
      )}
    </>
  );
}

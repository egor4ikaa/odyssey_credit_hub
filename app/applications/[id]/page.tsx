'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { Timeline } from '@/components/Timeline';
import { Assistant } from '@/components/Assistant';
import { Footer } from '@/components/Footer';
import {
  IconCheck,
  IconX,
  IconCheckCircle,
  IconArrowRight,
  IconChartBar,
  IconBriefcase,
  IconBuilding
} from '@/components/icons';

interface AppFull {
  id: string; number: string; amount: number; term: number; goal: string;
  status: any; score: number | null; decisionReason: string | null; conditions: any;
  product: { id: string; name: string; rate: number };
  company: { name: string; inn: string; revenueYear: number };
  events: any[];
}

interface ProductAlt {
  id: string; name: string; tagline: string; rate: number; maxAmount: number;
}

interface ScoreFactor {
  label: string;
  delta: number;
}

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('ru-RU');
const TERMINAL = ['CLOSED', 'CANCELLED', 'REJECTED'];

export default function ApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<AppFull | null>(null);
  const [products, setProducts] = useState<ProductAlt[]>([]);
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/applications/${id}`);
    if (res.status === 401) return router.push('/');
    if (res.ok) setApp((await res.json()).application);
  }, [id, router]);

  useEffect(() => {
    load();
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products || []));
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [load]);

  async function act(path: string) {
    setBusy(true);
    await fetch(path, { method: 'POST' });
    await load();
    setBusy(false);
  }

  if (!app) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Загружаем заявку…</div>;
  }

  const cond = app.conditions;
  const decided = app.status === 'APPROVED' || app.status === 'APPROVED_WITH_CONDITIONS';
  const needInfo = app.status === 'ADDITIONAL_INFO_REQUIRED';

  /* Прозрачность факторов (исследование, разд. 5.2: клиент видит, какие данные влияют на решение) */
  const scoreEvent = (app.events || []).find((e: any) => e.type === 'SCORE' && e.meta);
  let factors: ScoreFactor[] = [];
  try {
    if (scoreEvent) factors = (JSON.parse(scoreEvent.meta).factors || []) as ScoreFactor[];
  } catch {
    factors = [];
  }

  /* Альтернативные продукты при отказе (исследование, разд. 1.2: система предлагает варианты, а не просто отказ) */
  const alternatives = products
    .filter((p) => p.id !== app.product.id && p.maxAmount >= Math.round(app.amount * 0.5))
    .slice(0, 2);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-gray-900">{app.number}</h1>
            <p className="mt-1 text-sm text-gray-500">{app.product.name} · {fmt(app.amount)} ₽ · {app.term} мес.</p>
          </div>
          <StatusBadge status={app.status} pulse={!TERMINAL.includes(app.status)} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="glass p-6 lg:col-span-3">
            <h2 className="mb-5 font-display text-lg font-bold text-gray-900">Ход рассмотрения</h2>
            <Timeline events={app.events} />
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="glass p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-gray-400">
                  <IconBuilding className="h-4 w-4" /> ЕГРЮЛ и ГИР БО
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                  <IconCheckCircle className="h-3.5 w-3.5" /> Активна
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="font-semibold text-gray-900 text-base">{app.company.name}</div>
                <div className="text-xs text-gray-500">ИНН {app.company.inn}</div>
                <div className="pt-2 border-t border-brand-500/10 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Годовая выручка</span><b>{fmt(app.company.revenueYear)} ₽</b></div>
                  <div className="flex justify-between"><span className="text-gray-500">Активы (ГИР БО)</span><b>{fmt(Math.round(app.company.revenueYear * 0.7))} ₽</b></div>
                  <div className="flex justify-between"><span className="text-gray-500">Чистый капитал</span><b>{fmt(Math.round(app.company.revenueYear * 0.4))} ₽</b></div>
                </div>
                {app.score != null && (
                  <div className="pt-3 border-t border-brand-500/10">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                        <IconChartBar className="h-3.5 w-3.5 text-violet-500" /> Кредитный скоринг
                      </span>
                      <span className="font-display text-sm font-bold text-violet-600">{app.score} / 1000</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full" style={{ width: `${(app.score / 1000) * 100}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">Оценка надёжности на основе истории БКИ, ФНС и финансовой отчётности ГИР БО.</p>
                  </div>
                )}
                {factors.length > 0 && (
                  <div className="pt-3 border-t border-brand-500/10">
                    <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-600">
                      <IconChartBar className="h-3.5 w-3.5 text-violet-500" /> Факторы скоринга
                    </div>
                    <ul className="space-y-1.5">
                      {factors.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${f.delta >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-brand-500/10 text-brand-600'}`}>
                            {f.delta >= 0 ? <IconCheck className="h-2.5 w-2.5" /> : <IconX className="h-2.5 w-2.5" />}
                          </span>
                          <span className="leading-snug text-gray-600">
                            {f.label}{' '}
                            <b className={f.delta >= 0 ? 'text-emerald-600' : 'text-brand-600'}>
                              {f.delta > 0 ? `+${f.delta}` : f.delta}
                            </b>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] text-gray-400">Улучшите показатели (закройте задолженности, увеличьте обороты) — и следующая заявка получит более высокий балл.</p>
                  </div>
                )}
              </div>
            </div>

            {decided && cond && (
              <div className="glass border-emerald-500/20 p-6">
                <h3 className="flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-emerald-600">
                  <IconCheckCircle className="h-4 w-4" />
                  {app.status === 'APPROVED' ? 'Одобрено' : 'Одобрено с условиями'}
                </h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Сумма</span><b>{fmt(cond.amount)} ₽</b></div>
                  <div className="flex justify-between"><span className="text-gray-500">Срок</span><b>{cond.term} мес.</b></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ставка</span><b>{cond.rate}% годовых</b></div>
                  <div className="flex justify-between"><span className="text-gray-500">Платёж</span><b>~{fmt(cond.monthlyPayment)} ₽/мес.</b></div>
                </div>
                {app.decisionReason && <p className="mt-3 text-xs text-gray-500">{app.decisionReason}</p>}
                <div className="mt-5 flex gap-3">
                  <button className="btn-primary flex flex-1 items-center justify-center gap-2 !bg-none !bg-emerald-500 !shadow-none" disabled={busy} onClick={() => act(`/api/applications/${id}/accept`)}>
                    <IconCheck className="h-4 w-4" /> Принять условия
                  </button>
                  <button className="btn-ghost flex items-center gap-2" disabled={busy} onClick={() => act(`/api/applications/${id}/decline`)}>
                    <IconX className="h-4 w-4" /> Отказаться
                  </button>
                </div>
              </div>
            )}

            {needInfo && (
              <div className="glass border-amber-500/30 p-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-amber-600">Требуется уточнение</h3>
                <p className="mt-2 text-sm text-gray-600">{app.decisionReason ?? 'Банку нужны уточнения по параметрам заявки.'}</p>
                <div className="mt-4 space-y-3">
                  <input className="input" placeholder={`Сумма (₽), текущая: ${fmt(app.amount)}`} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" />
                  <input className="input" placeholder={`Срок (мес.), текущий: ${app.term}`} value={term} onChange={(e) => setTerm(e.target.value)} inputMode="numeric" />
                  <button
                    className="btn-primary w-full" disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await fetch(`/api/applications/${id}/update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: amount || undefined, term: term || undefined })
                      });
                      await act(`/api/applications/${id}/submit`);
                      setBusy(false);
                    }}
                  >
                    Сохранить и отправить повторно
                  </button>
                </div>
              </div>
            )}

            {app.status === 'REJECTED' && (
              <div className="glass border-brand-500/20 p-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-brand-600">Решение: отказ</h3>
                {app.decisionReason && <p className="mt-2 text-sm text-gray-600">{app.decisionReason}</p>}

                {alternatives.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                      <IconBriefcase className="h-4 w-4 text-brand-500" /> Возможно, подойдёт другой продукт
                    </div>
                    <div className="space-y-2">
                      {alternatives.map((p) => (
                        <Link
                          key={p.id}
                          href={`/apply?product=${p.id}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-brand-500/15 bg-white/70 px-4 py-3 text-sm transition hover:border-brand-400 hover:bg-white"
                        >
                          <span>
                            <b className="text-gray-900">{p.name}</b>
                            <span className="block text-xs text-gray-500">от {p.rate}% годовых · до {fmt(p.maxAmount)} ₽</span>
                          </span>
                          <IconArrowRight className="h-4 w-4 shrink-0 text-brand-500" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <LinkButton />
              </div>
            )}
          </div>
        </div>
      </div>
      <Assistant applicationId={id} contextHint={`Заявка ${app.number}`} />
      <Footer />
    </div>
  );
}

function LinkButton() {
  const router = useRouter();
  return (
    <button className="btn-ghost mt-4 w-full" onClick={() => router.push('/dashboard')}>
      Подать новую заявку
    </button>
  );
}

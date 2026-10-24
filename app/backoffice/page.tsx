'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import type { AppStatus } from '@/lib/status';
import { STATUS_LABELS } from '@/lib/status';
import { Footer } from '@/components/Footer';
import { IconShieldCheck, IconPencil, IconTrash, IconRefreshCw, IconX } from '@/components/icons';

interface AppItem {
  id: string; number: string; amount: number; term: number; goal: string; score: number | null;
  status: AppStatus; decisionReason: string | null; conditions: any; createdAt: string;
  product: { name: string; rate: number };
  company: { name: string; inn: string; revenueYear: number };
  user: { name: string; email: string };
}
const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('ru-RU');

export default function BackofficePage() {
  const router = useRouter();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [comment, setComment] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');

  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editTerm, setEditTerm] = useState<number>(0);
  const [editRate, setEditRate] = useState<number>(0);
  const [editMonthlyPayment, setEditMonthlyPayment] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (!d.user) router.push('/');
      else if (d.user.role !== 'OPERATOR') router.push('/dashboard');
    });
  }, [router]);

  const load = useCallback(() => {
    fetch(`/api/backoffice?status=${filterStatus}`)
      .then((r) => (r.ok ? r.json() : { applications: [] }))
      .then((d) => setApps(d.applications || []));
  }, [filterStatus]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  async function action(id: string, act: string) {
    setBusy(id + act);
    await fetch(`/api/backoffice/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: act, comment: comment[id] })
    });
    setBusy('');
    load();
  }

  async function deleteApp(id: string) {
    if (!confirm('Удалить эту заявку из системы?')) return;
    setBusy(id + 'del');
    await fetch(`/api/backoffice/${id}`, { method: 'DELETE' });
    setBusy('');
    load();
  }

  function openEdit(app: AppItem) {
    setEditingApp(app);
    setEditAmount(app.amount);
    setEditTerm(app.term);
    const cond = app.conditions || {};
    setEditRate(cond.rate || app.product.rate);
    setEditMonthlyPayment(cond.monthlyPayment || 0);
    setEditStatus(app.status);
    setEditReason(app.decisionReason || '');
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingApp) return;
    setBusy(editingApp.id + 'edit');
    const res = await fetch(`/api/backoffice/${editingApp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: editAmount,
        term: editTerm,
        rate: editRate,
        monthlyPayment: editMonthlyPayment,
        status: editStatus,
        decisionReason: editReason
      })
    });
    setBusy('');
    if (res.ok) {
      setEditingApp(null);
      load();
    } else {
      const d = await res.json();
      alert(d.error || 'Ошибка сохранения');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-brand-50/30">
      <Header />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900">Кабинет администратора</h1>
            <p className="mt-1 text-gray-600">
              Мониторинг всех запросов, проверка на выходе, ручной андеррайтинг, редактирование параметров и управление заявками.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { key: 'ALL', label: 'Все заявки' },
              { key: 'MANUAL_REVIEW', label: 'На ручной проверке' },
              { key: 'APPROVED', label: 'Одобрено' },
              { key: 'REJECTED', label: 'Отказ' },
              { key: 'DISBURSEMENT', label: 'Выдача' }
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setFilterStatus(st.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  filterStatus === st.key ? 'bg-brand-500 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {st.label}
              </button>
            ))}
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 transition hover:bg-gray-100"
              title="Обновить список"
            >
              <IconRefreshCw className="h-3.5 w-3.5" /> Обновить
            </button>
          </div>
        </div>

        {apps.length === 0 ? (
          <div className="glass mt-8 p-12 text-center text-gray-500">
            Заявки по выбранному фильтру не найдены.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {apps.map((q) => {
              const cond = q.conditions || {};
              const rateVal = cond.rate ?? q.product.rate;
              const paymentVal = cond.monthlyPayment ?? 0;

              return (
                <div key={q.id} className="glass p-6 transition hover:shadow-glow">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-lg font-bold text-gray-900">{q.number}</span>
                        <StatusBadge status={q.status} />
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {q.product.name} · Сумма: <b>{fmt(q.amount)} ₽</b> · Период: <b>{q.term} мес.</b> · Процент: <b>{rateVal}%</b> · Платёж: <b>{fmt(paymentVal)} ₽/мес.</b>
                      </div>
                    </div>
                    {q.score != null && (
                      <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600">
                        Скоринг: {q.score}/1000
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/70 p-3">
                      <div className="text-xs uppercase tracking-wide text-gray-400">Клиент</div>
                      <div className="mt-1 font-semibold">{q.user.name}</div>
                      <div className="text-xs text-gray-500">{q.user.email}</div>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-3">
                      <div className="text-xs uppercase tracking-wide text-gray-400">Компания (ИНН {q.company.inn})</div>
                      <div className="mt-1 font-semibold">{q.company.name}</div>
                      <div className="text-xs text-gray-500">Выручка: {fmt(q.company.revenueYear)} ₽</div>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-3">
                      <div className="text-xs uppercase tracking-wide text-gray-400">Цель / Решение</div>
                      <div className="mt-1 font-medium">{q.goal}</div>
                      {q.decisionReason && <div className="mt-1 text-xs text-brand-600">{q.decisionReason}</div>}
                    </div>
                  </div>

                  {q.status === 'MANUAL_REVIEW' && (
                    <input
                      className="input mt-4 text-sm"
                      placeholder="Комментарий к решению (необязательно)"
                      value={comment[q.id] ?? ''}
                      onChange={(e) => setComment((c) => ({ ...c, [q.id]: e.target.value }))}
                    />
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {q.status === 'MANUAL_REVIEW' && (
                        <>
                          <button className="btn-primary !bg-emerald-500 !py-2 text-xs" disabled={!!busy} onClick={() => action(q.id, 'approve')}>Одобрить</button>
                          <button className="btn-ghost !text-red-600 !py-2 text-xs" disabled={!!busy} onClick={() => action(q.id, 'reject')}>Отказать</button>
                          <button className="btn-ghost !py-2 text-xs" disabled={!!busy} onClick={() => action(q.id, 'request_info')}>Запросить уточнения</button>
                        </>
                      )}
                      <button
                        className="flex items-center gap-1.5 rounded-xl bg-brand-500/10 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-500/20"
                        disabled={!!busy}
                        onClick={() => action(q.id, 'verify_output')}
                        title="Проверить на выходе перед финальной выдачей"
                      >
                        <IconShieldCheck className="h-3.5 w-3.5" /> Проверить на выходе
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
                        onClick={() => openEdit(q)}
                      >
                        <IconPencil className="h-3.5 w-3.5" /> Редактировать
                      </button>
                      <button
                        className="flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        disabled={!!busy}
                        onClick={() => deleteApp(q.id)}
                      >
                        <IconTrash className="h-3.5 w-3.5" /> Удалить
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Modal */}
        {editingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-gray-900">Редактирование заявки {editingApp.number}</h3>
                <button
                  onClick={() => setEditingApp(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Закрыть"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={saveEdit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Сумма (₽)</label>
                  <input className="input" type="number" value={editAmount} onChange={(e) => setEditAmount(Number(e.target.value))} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Период (мес.)</label>
                  <input className="input" type="number" value={editTerm} onChange={(e) => setEditTerm(Number(e.target.value))} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Процентная ставка (% годовых)</label>
                  <input className="input" type="number" step="0.1" value={editRate} onChange={(e) => setEditRate(Number(e.target.value))} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Ежемесячный платёж (₽)</label>
                  <input className="input" type="number" value={editMonthlyPayment} onChange={(e) => setEditMonthlyPayment(Number(e.target.value))} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Статус заявки</label>
                  <select className="input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    {(['DRAFT', 'SUBMITTED', 'VERIFICATION', 'SCORING', 'MANUAL_REVIEW', 'APPROVED', 'APPROVED_WITH_CONDITIONS', 'REJECTED', 'DISBURSEMENT', 'CLOSED', 'CANCELLED'] as AppStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Причина / Комментарий решения</label>
                  <input className="input" value={editReason} onChange={(e) => setEditReason(e.target.value)} />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingApp(null)} className="btn-ghost">Отмена</button>
                  <button type="submit" className="btn-primary" disabled={!!busy}>Сохранить изменения</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

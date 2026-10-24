'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { Assistant } from '@/components/Assistant';
import { Footer } from '@/components/Footer';
import { IconTrash, IconArrowRight, IconStar, IconWallet } from '@/components/icons';

interface Product {
  id: string; name: string; tagline: string; description: string;
  minAmount: number; maxAmount: number; minTerm: number; maxTerm: number; rate: number;
}
interface AppItem {
  id: string; number: string; amount: number; term: number; status: any;
  product: { name: string }; createdAt: string;
}
interface SravniOffer {
  bankName: string;
  productName: string;
  category: string;
  psk: string;
  minRate: number;
  maxAmount: number;
  maxTermMonths: number;
  maxTermFormatted: string;
  rating: number;
}

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('ru-RU');

export default function DashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [offers, setOffers] = useState<SravniOffer[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (!d.user) router.push('/');
      else if (d.user.role === 'OPERATOR') router.push('/backoffice');
    });
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products));
    fetch('/api/sravni').then((r) => r.json()).then((d) => setOffers(d.offers || []));
    loadApps();
    const t = setInterval(loadApps, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadApps() {
    const res = await fetch('/api/applications');
    if (res.ok) setApps((await res.json()).applications);
  }

  async function deleteApp(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Вы действительно хотите удалить эту заявку из истории?')) return;
    setDeletingId(id);
    const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok) {
      loadApps();
    } else {
      const d = await res.json();
      alert(d.error || 'Ошибка удаления');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-brand-50/30">
      <Header />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900">Продукты для бизнеса</h1>
            <p className="mt-1 text-gray-600">Выберите направление финансирования или сравните с предложениями Сравни.ру.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="glass flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="font-display text-lg font-bold text-gray-900">{p.name}</div>
              <div className="mt-1 text-sm font-medium text-brand-600">{p.tagline}</div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{p.description}</p>
              <div className="mt-5 space-y-1.5 text-sm text-gray-700">
                <div>Сумма: <b>{fmt(p.minAmount)} – {fmt(p.maxAmount)} ₽</b></div>
                <div>Период: <b>{p.minTerm} – {p.maxTerm} мес.</b></div>
                <div>Процент: <b>от {p.rate}% годовых</b></div>
              </div>
              <Link href={`/apply?product=${p.id}`} className="btn-primary mt-6 w-full text-center">Оформить заявку</Link>
            </div>
          ))}
        </div>

        {/* My Applications Section */}
        <div className="mt-14 flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold text-gray-900">Мои заявки и история</h2>
          <span className="text-xs text-gray-500">Вы можете удалять свои старые заявки</span>
        </div>

        {apps.length === 0 ? (
          <div className="glass mt-6 p-8 text-center text-gray-500">Заявок пока нет — выберите продукт выше.</div>
        ) : (
          <div className="mt-6 space-y-4">
            {apps.map((a) => (
              <div key={a.id} className="glass flex flex-wrap items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-glow">
                <Link href={`/applications/${a.id}`} className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{a.number}</span>
                    <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">{a.product.name} · {fmt(a.amount)} ₽ · {a.term} мес.</div>
                </Link>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} pulse={!['CLOSED', 'CANCELLED', 'REJECTED', 'APPROVED'].includes(a.status)} />
                  <Link href={`/applications/${a.id}`} className="btn-ghost !px-3 !py-1.5 text-xs">
                    <IconArrowRight className="h-3.5 w-3.5" /> Открыть
                  </Link>
                  <button
                    onClick={(e) => deleteApp(a.id, e)}
                    disabled={deletingId === a.id}
                    className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    title="Удалить заявку из истории"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                    {deletingId === a.id ? 'Удаление…' : 'Удалить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sravni.ru Market Widget */}
        <div className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Агрегатор Сравни.ру</span>
              <h2 className="font-display text-2xl font-extrabold text-gray-900">Рыночные предложения банков</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {offers.slice(0, 6).map((o, i) => (
              <div key={i} className="glass p-5 transition hover:-translate-y-1 hover:shadow-glow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">{o.bankName}</span>
                  <span className="flex items-center gap-1 rounded bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                    <IconStar className="h-3 w-3" /> {o.rating}
                  </span>
                </div>
                <div className="mt-1 font-display text-base font-bold text-gray-900">{o.productName}</div>
                <div className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{o.category}</div>
                <div className="mt-3 space-y-1 text-xs text-gray-700">
                  <div className="flex justify-between"><span className="text-gray-500">ПСК:</span> <b>{o.psk}</b></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ставка:</span> <b className="text-brand-600">от {o.minRate}%</b></div>
                  <div className="flex justify-between"><span className="text-gray-500">Сумма:</span> <b>до {fmt(o.maxAmount)} ₽</b></div>
                  <div className="flex justify-between"><span className="text-gray-500">Срок:</span> <b>{o.maxTermFormatted || `до ${o.maxTermMonths} мес.`}</b></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 glass p-6 flex items-start gap-3">
          <IconWallet className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
          <p className="text-sm text-gray-600 leading-relaxed">
            <b>Как это работает:</b> заявка проходит единый конвейер — проверка данных, запрос внешних источников (ЕГРЮЛ, ФНС, БКИ),
            скоринговая оценка и решение. Каждый шаг отображается в карточке заявки в реальном времени, а факторы скоринга — открыто и прозрачно.
          </p>
        </div>
      </div>
      <Assistant contextHint="Помогу выбрать продукт или рассчитать график" />
      <Footer />
    </div>
  );
}

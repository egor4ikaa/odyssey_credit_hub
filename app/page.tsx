'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Footer } from '@/components/Footer';
import { IconSparkles, IconStar, IconArrowRight, IconLandmark } from '@/components/icons';

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
  source: string;
}

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('ru-RU');

export default function LandingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register' | 'about'>('login');

  // Login state
  const [email, setEmail] = useState('client@demo.ru');
  const [password, setPassword] = useState('demo123');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regInn, setRegInn] = useState('7701234567');
  const [regCompanyName, setRegCompanyName] = useState('ООО "Омега Плюс"');
  const [regRevenue, setRegRevenue] = useState('15000000');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sravniOffers, setSravniOffers] = useState<SravniOffer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [categories, setCategories] = useState<string[]>(['Все', 'Бизнес-кредит', 'Кредит наличными', 'Рефинансирование', 'Залоговый', 'На любые цели']);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          router.push(d.user.role === 'OPERATOR' ? '/backoffice' : '/dashboard');
        }
      })
      .catch(() => {});

    fetch('/api/sravni')
      .then((r) => r.json())
      .then((d) => {
        if (d.offers) setSravniOffers(d.offers);
        if (d.categories) setCategories(d.categories);
      })
      .catch(() => {});
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const isValidEmail = (em: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
    if (!isValidEmail(email)) {
      setError('Пожалуйста, введите корректный email адрес');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка входа');
      router.push(data.user.role === 'OPERATOR' ? '/backoffice' : '/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const isValidEmail = (em: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
    if (!isValidEmail(regEmail)) {
      setError('Пожалуйста, введите корректный email адрес для регистрации');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          inn: regInn,
          companyName: regCompanyName,
          revenueYear: regRevenue
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-brand-50/30 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-brand-500/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 font-display text-lg font-extrabold text-white shadow-glow">
              A
            </span>
            <div>
              <div className="font-display text-sm font-bold tracking-tight text-gray-900">
                Odyssey <span className="text-brand-500">КРЕДИТ ХАБ</span>
              </div>
              <div className="text-[10px] text-gray-500">Интеллектуальная экосистема бизнес-кредитования</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('about')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === 'about' ? 'bg-brand-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              О проекте и Сравни.ру
            </button>
            <button
              onClick={() => setTab('login')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === 'login' ? 'bg-brand-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setTab('register')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === 'register' ? 'bg-brand-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Регистрация с ИНН
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        {tab === 'about' && (
          <div className="space-y-12 animate-fadeIn">
            {/* Hero Explanatory Section */}
            <div className="rounded-3xl border border-brand-500/20 bg-white/90 p-8 shadow-xl md:p-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-600">
                <IconSparkles className="h-3.5 w-3.5" /> Разбор платформы и источников данных
              </span>
              <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
                Как устроен <span className="text-brand-500">Odyssey Кредит Хаб</span>
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-600 md:text-lg">
                Наша система объединяет мультибанковскую экспертизу, автоматический скоринг по государственным реестрам
                и интеграцию с ведущим финансовым агрегатором <b>Сравни.ру</b> для подбора лучших условий финансирования бизнеса.
              </p>

              <div className="mt-10 grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 font-display text-sm font-bold text-brand-600">1</div>
                  <h3 className="mt-4 font-display text-lg font-bold">Суть и логика</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Предприниматель подает заявку по ИНН. Платформа в реальном времени анализирует финансовое положение компании,
                    вычисляет кредитный рейтинг с помощью машинного обучения и формирует персональное предложение (обучение проводилось на данных ФНС через систему Google Collab).
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 font-display text-sm font-bold text-brand-600">2</div>
                  <h3 className="mt-4 font-display text-lg font-bold">Источники данных</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Данные поступают из ЕГРЮЛ (статус юрлица, ОКВЭД, руководство), ФНС («Прозрачный бизнес» — налоги и задолженности),
                    БКИ (кредитная история) и <b>API Сравни.ру</b> (необходимо провести переговоры, чтобы получить доступ к API с актуальными рыночными ставками и офферы ведущих банков РФ).
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 font-display text-sm font-bold text-brand-600">3</div>
                  <h3 className="mt-4 font-display text-lg font-bold">Как работать</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    1. Зарегистрируйтесь и добавьте ИНН.<br />
                    2. Выберите цель и продукт, укажите сумму.<br />
                    3. Отслеживайте статус, факторы скоринга и условия в личном кабинете.
                  </p>
                </div>
              </div>
            </div>

            {/* Sravni.ru Integration Section */}
            <div className="rounded-3xl border border-brand-500/20 bg-white/90 p-8 shadow-xl md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Интеграция Сравни.ру</span>
                  <h2 className="font-display text-2xl font-extrabold text-gray-900">Актуальные рыночные предложения всех видов кредитов</h2>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Мы сопоставляем условия Odyssey Кредит Хаб с базой данных агрегатора Сравни.ру по всем категориям кредитов, чтобы гарантировать лучшие процентные ставки и лимиты.
              </p>

              {/* Category Filter Pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sravniOffers
                  .filter((o) => selectedCategory === 'Все' || o.category === selectedCategory)
                  .map((o, idx) => (
                    <div key={idx} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 transition hover:shadow-md hover:border-brand-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">{o.bankName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-gray-200/70 px-2 py-0.5 text-[10px] font-medium text-gray-600">{o.category}</span>
                          <span className="flex items-center gap-1 rounded bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-600">
                            <IconStar className="h-3 w-3" /> {o.rating}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 font-display text-base font-bold text-gray-900">{o.productName}</div>

                      <div className="mt-4 space-y-1.5 text-xs text-gray-700">
                        <div className="flex justify-between border-b border-gray-200/50 pb-1">
                          <span className="text-gray-500">ПСК:</span>
                          <b className="text-gray-900">{o.psk}</b>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/50 pb-1">
                          <span className="text-gray-500">Ставка:</span>
                          <b className="text-brand-600">от {o.minRate}%</b>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/50 pb-1">
                          <span className="text-gray-500">Сумма:</span>
                          <b>до {fmt(o.maxAmount)} ₽</b>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Срок:</span>
                          <b>{o.maxTermFormatted || `до ${o.maxTermMonths} мес.`}</b>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-gray-200/60 pt-2.5 text-[11px] text-gray-400 flex justify-between items-center">
                        <span>Источник: {o.source}</span>
                        <span className="flex items-center gap-1 text-brand-600 font-semibold text-[11px] cursor-pointer hover:underline">
                          Подробнее <IconArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'login' && (
          <div className="grid gap-10 md:grid-cols-2 md:items-center animate-fadeIn">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-white/70 px-4 py-1.5 text-xs font-semibold text-brand-600 backdrop-blur">
                Хакатон 2026 · Личный кабинет
              </div>
              <h1 className="font-display text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl">
                Кредит для бизнеса — <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">без лишней бюрократии</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-gray-600">
                Полный контроль заявок, графиков платежей, процентных ставок и сроков. ИИ-скоринг и автоматические проверки по базам ФНС и ЕГРЮЛ.
              </p>
              <div className="mt-8 flex gap-4">
                <button onClick={() => setTab('register')} className="btn-primary">Зарегистрироваться с ИНН</button>
                <button onClick={() => setTab('about')} className="btn-ghost">Узнать о проекте</button>
              </div>
            </div>

            <form onSubmit={handleLogin} className="rounded-3xl border border-brand-500/20 bg-white p-8 shadow-xl">
              <h2 className="font-display text-xl font-bold text-gray-900">Вход в систему</h2>
              <p className="mt-1 text-sm text-gray-500">
                Демо клиент: <code className="text-brand-600">client@demo.ru</code> / <code className="text-brand-600">demo123</code><br />
                Демо админ: <code className="text-brand-600">operator@demo.ru</code> / <code className="text-brand-600">demo123</code>
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Пароль</label>
                  <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{error}</div>}
                <button className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Входим…' : 'Войти в кабинет'}
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'register' && (
          <div className="mx-auto max-w-2xl animate-fadeIn">
            <form onSubmit={handleRegister} className="rounded-3xl border border-brand-500/20 bg-white p-8 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Быстрый ввод данных</span>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-gray-900">Регистрация предпринимателя</h2>
              <p className="mt-1 text-sm text-gray-500">
                Укажите реквизиты компании заранее, чтобы они автоматически подставлялись во все заявки и кредитные расчеты.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Ваше имя</label>
                  <input className="input" placeholder="Иван Иванович" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                  <input className="input" type="email" placeholder="boss@company.ru" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Пароль</label>
                  <input className="input" type="password" placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ИНН компании / ИП</label>
                  <input className="input" placeholder="7701234567" value={regInn} onChange={(e) => setRegInn(e.target.value.replace(/\D/g, ''))} maxLength={12} inputMode="numeric" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Название компании</label>
                  <input className="input" placeholder="ООО «ТоргСервис»" value={regCompanyName} onChange={(e) => setRegCompanyName(e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Годовая выручка (руб.)</label>
                  <input className="input" type="number" placeholder="15000000" value={regRevenue} onChange={(e) => setRegRevenue(e.target.value)} required />
                </div>
              </div>

              {error && <div className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{error}</div>}

              <button className="btn-primary mt-6 w-full" disabled={loading}>
                {loading ? 'Создаем кабинет…' : 'Зарегистрироваться и войти'}
              </button>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

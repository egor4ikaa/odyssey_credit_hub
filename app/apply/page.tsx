'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { IconLightbulb, IconSearch, IconRocket, IconBriefcase, IconFileText } from '@/components/icons';

interface Product {
  id: string; code?: string; name: string; tagline: string; description?: string;
  minAmount: number; maxAmount: number; minTerm: number; maxTerm: number; rate: number;
}

/* Подбор продукта по цели — требование исследования (разд. 5.1, шаг 2) и ТЗ «Минимальный сквозной кредитный путь» */
const PURPOSES = [
  { value: 'working', label: 'Пополнение оборотных средств', desc: 'Закупка товаров, сырья, материалов, выплата зарплат и покрытие кассовых разрывов.', productCode: 'OVERDRAFT_WORKING' },
  { value: 'investment', label: 'Инвестиции: оборудование и развитие', desc: 'Покупка станков, оборудования, спецтехники, недвижимости и масштабное развитие бизнеса.', productCode: 'INVESTMENT' },
  { value: 'line', label: 'Рамочный лимит на расходы', desc: 'Возобновляемый лимит — средства доступны в любой момент, проценты платятся только за фактически использованную сумму.', productCode: 'CREDIT_LINE' },
  { value: 'refinance', label: 'Рефинансирование действующего кредита', desc: 'Погашение дорогих кредитов в других банках под более низкий процент на платформе.', productCode: 'OVERDRAFT_WORKING' }
];

const BUSINESS_TYPES = ['ООО', 'ИП', 'Самозанятость', 'АО', 'СПК', 'Колхоз', 'КФХ'];
const INDUSTRIES = [
  'Промышленность (машиностроение, металлургия, химия и т.д.)',
  'Сельское хозяйство (СПК, колхоз, КФХ)',
  'Строительство',
  'Транспорт и связь',
  'Торговля (оптовая и розничная)',
  'Услуги (гостиницы, общественное питание, образование, здравоохранение, культура)'
];

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('ru-RU');

function ApplyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [purpose, setPurpose] = useState<string>('working');
  const [productId, setProductId] = useState(params.get('product') ?? '');
  const [businessTypes, setBusinessTypes] = useState<string[]>(['ООО']);
  const [industry, setIndustry] = useState<string>(INDUSTRIES[4]);
  const [selectedForms, setSelectedForms] = useState<string[]>([
    'Форма №1 (Бухгалтерский баланс)',
    'Форма №2 (Отчет о финансовых результатах)'
  ]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const ACCOUNTING_FORMS = [
    'Форма №1 (Бухгалтерский баланс)',
    'Форма №2 (Отчет о финансовых результатах)',
    'Форма №3 (Отчет об изменениях капитала)',
    'Форма №4 (Отчет о движении денежных средств)',
    'Форма №5 / Пояснительная записка'
  ];

  const toggleForm = (formName: string) => {
    setSelectedForms((prev) =>
      prev.includes(formName) ? prev.filter((f) => f !== formName) : [...prev, formName]
    );
  };
  const [inn, setInn] = useState('7701234567');
  const [amount, setAmount] = useState(1000000);
  const [term, setTerm] = useState(12);
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const product = products.find((p) => p.id === productId);
  const purposeLabel = PURPOSES.find((p) => p.value === purpose)?.label ?? '';

  const toggleBusinessType = (bt: string) => {
    setBusinessTypes((prev) =>
      prev.includes(bt) ? (prev.length > 1 ? prev.filter((item) => item !== bt) : prev) : [...prev, bt]
    );
  };

  const getAiRecommendation = () => {
    if (industry.includes('Сельское хозяйство')) {
      return 'Для КФХ, СПК и колхозов лучшим выбором является Инвестиционный кредит (от 14.5% годовых до 5 лет) под залог техники или Кредитная линия на сезонно-полевые работы.';
    }
    if (industry.includes('Промышленность')) {
      return 'Для промышленных предприятий идеален Инвестиционный кредит на модернизацию оборудования или Оборотный кредит на закупку сырья с отсрочкой платежей.';
    }
    if (industry.includes('Торговля')) {
      return 'Для оптовой и розничной торговли отлично подходит Кредитная линия (возобновляемый лимит, платите проценты только за фактически использованные средства).';
    }
    if (industry.includes('Строительство')) {
      return 'Для строительных компаний рекомендуем Кредитную линию для обеспечения госконтрактов и выполнения субподрядных работ.';
    }
    return 'Учитывая ваш профиль деятельности, мы подобрали гибкий Оборотный кредит с быстрым одобрением без залога.';
  };

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then((d) => {
      setProducts(d.products);
      if (!params.get('product') && d.products[0]) setProductId(d.products[0].id);
    });
  }, [params]);

  /* Автоподбор продукта под выбранную цель */
  useEffect(() => {
    if (!products.length) return;
    const match = PURPOSES.find((p) => p.value === purpose);
    const prod = products.find((p) => p.code === match?.productCode) ?? products[0];
    if (prod && !params.get('product')) setProductId(prod.id);
  }, [purpose, products, params]);

  async function create(submitAfter: boolean) {
    setError('');
    setBusy(true);
    try {
      const allFormsList = [...selectedForms, ...uploadedFiles].join(', ');
      const combinedGoal = `[Форма бизнеса: ${businessTypes.join(', ')} | Отрасль: ${industry}] ${goal || purposeLabel || (product ? product.tagline : '')} [Бух. отчетность пакетом: ${allFormsList || 'Автоданные ФНС/ГИР БО'}]`;
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          inn,
          amount,
          term,
          goal: combinedGoal
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка создания заявки');
      if (submitAfter) {
        await fetch(`/api/applications/${data.application.id}/submit`, { method: 'POST' });
      }
      router.push(`/applications/${data.application.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent p-6 border border-brand-500/20">
          <div className="inline-block rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white mb-2">Пошаговый помощник для бизнеса</div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900">Оформление кредитной заявки</h1>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Мы проведём вас за ручку: укажите ИНН, и система автоматически проверит компанию по ЕГРЮЛ, ФНС и ГИР БО (бухгалтерской отчётности), рассчитает персональный лимит и предложит лучшие условия без визитов в банк.
          </p>
        </div>

        <div className="glass space-y-8 p-8">
          {/* Шаг 1: цель */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">1</span>
              Шаг 1 из 4 · Цель финансирования
            </div>
            <select className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {PURPOSES.find((p) => p.value === purpose)?.desc && (
              <p className="flex items-start gap-2 text-xs text-gray-500 bg-white/60 p-3 rounded-2xl">
                <IconLightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <span><b>Назначение:</b> {PURPOSES.find((p) => p.value === purpose)?.desc}</span>
              </p>
            )}
          </div>

          {/* Шаг 2: продукт */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">2</span>
              Шаг 2 из 4 · Кредитный продукт
            </div>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — до {fmt(p.maxAmount)} ₽, от {p.rate}% годовых</option>
              ))}
            </select>
            {product && (
              <p className="flex items-start gap-2 text-xs text-gray-500 bg-white/60 p-3 rounded-2xl">
                <IconLightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <span><b>{product.name}:</b> {product.description} Подходит для срочных расходов и развития бизнеса.</span>
              </p>
            )}
          </div>

          {/* Шаг 3: ИНН */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">3</span>
              Шаг 3 из 4 · Проверка компании (ЕГРЮЛ / ЕГРИП и ГИР БО)
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">ИНН организации или ИП</label>
              <input className="input" value={inn} onChange={(e) => setInn(e.target.value.replace(/\D/g, ''))} maxLength={12} inputMode="numeric" placeholder="Например: 7701234567" />
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                <span>Быстрые демо-ИНН:</span>
                <button type="button" onClick={() => setInn('7701234567')} className="font-semibold text-brand-600 underline">ООО «Вектор» (48 млн выручка)</button>
                <button type="button" onClick={() => setInn('7722345678')} className="font-semibold text-brand-600 underline">ИП Смирнова (12.5 млн)</button>
                <button type="button" onClick={() => setInn('7709876543')} className="font-semibold text-brand-600 underline">ООО «Гранит-Строй» (210 млн)</button>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-2xl bg-brand-50/60 p-4 text-xs text-gray-600 border border-brand-500/10">
              <IconSearch className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span><b>Автоматическая проверка за 2 секунды:</b> система запросит официальные данные из ЕГРЮЛ (статус действующих лиц), ФНС (отсутствие блокировок/задолженностей) и ГИР БО (государственная бухгалтерская отчётность: активы, капитал, чистая прибыль).</span>
            </div>
          </div>

          {/* Форма бизнеса, Отрасль и Форма №2 */}
          <div className="space-y-4 pt-4 border-t border-brand-500/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">★</span>
              Специфика бизнеса и бухгалтерская отчётность (Форма №2)
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Форма организации / бизнеса (выберите одну или несколько)</label>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => toggleBusinessType(bt)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                      businessTypes.includes(bt)
                        ? 'bg-brand-500 text-white shadow-glow'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {businessTypes.includes(bt) ? '✓ ' : ''}{bt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Отрасль экономики</label>
              <select className="input" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-brand-500/10 p-4 border border-violet-500/20 text-xs text-gray-700 space-y-2">
              <div className="font-bold text-violet-900 flex items-center gap-1.5">
                <IconLightbulb className="h-4 w-4 text-violet-600" /> Совет ИИ-кредитного директора:
              </div>
              <div>{getAiRecommendation()}</div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Пакет бухгалтерской отчётности (несколько форм для глубокого анализа ИИ)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                {ACCOUNTING_FORMS.map((formName) => (
                  <button
                    key={formName}
                    type="button"
                    onClick={() => toggleForm(formName)}
                    className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold text-left transition border ${
                      selectedForms.includes(formName)
                        ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] ${selectedForms.includes(formName) ? 'bg-brand-500 text-white' : 'border border-gray-300 bg-gray-100'}`}>
                      {selectedForms.includes(formName) ? '✓' : ''}
                    </span>
                    <span>{formName}</span>
                  </button>
                ))}
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setUploadedFiles((prev) => [...prev, e.dataTransfer.files[0].name]);
                  }
                }}
                onClick={() => {
                  const inp = document.createElement('input');
                  inp.type = 'file';
                  inp.multiple = true;
                  inp.accept = '.xlsx,.xls,.pdf,.docx,.doc,.csv,.zip';
                  inp.onchange = (ev: any) => {
                    if (ev.target.files) {
                      const names = Array.from(ev.target.files).map((f: any) => f.name);
                      setUploadedFiles((prev) => [...prev, ...names]);
                    }
                  };
                  inp.click();
                }}
                className="border-2 border-dashed border-brand-500/30 rounded-2xl p-5 text-center bg-white/70 hover:bg-white transition cursor-pointer shadow-sm"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 mb-2">
                  <IconFileText className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  {uploadedFiles.length > 0 ? `Прикреплено файлов: ${uploadedFiles.join(', ')}` : 'Нажмите или перетащите несколько файлов форм (Баланс, ОФР, ДДС и др.)'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Поддерживаются Excel, PDF, Word, CSV, ZIP (несколько файлов)</p>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                ИИ-кредитный директор комплексно проанализирует все выбранные формы и загруженные файлы (ликвидность, рентабельность, денежные потоки и финансовую устойчивость).
              </p>
            </div>
          </div>

          {/* Шаг 4: параметры */}
          <div className="space-y-6 pt-4 border-t border-brand-500/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">4</span>
              Шаг 4 из 4 · Желаемые параметры и цель
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Сумма финансирования</label>
                <span className="font-display text-lg font-bold text-brand-600">{fmt(amount)} ₽</span>
              </div>
              <input
                type="range" className="w-full accent-brand-500 cursor-pointer"
                min={product?.minAmount ?? 100000} max={product?.maxAmount ?? 5000000} step={50000}
                value={amount} onChange={(e) => setAmount(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{fmt(product?.minAmount ?? 100000)} ₽</span>
                <span>{fmt(product?.maxAmount ?? 5000000)} ₽</span>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Срок кредитования</label>
                <span className="font-display text-lg font-bold text-brand-600">{term} мес.</span>
              </div>
              <input
                type="range" className="w-full accent-brand-500 cursor-pointer"
                min={product?.minTerm ?? 3} max={product?.maxTerm ?? 24}
                value={term} onChange={(e) => setTerm(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{product?.minTerm ?? 3} мес.</span>
                <span>{product?.maxTerm ?? 24} мес.</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <IconBriefcase className="h-4 w-4 text-gray-400" /> Цель финансирования
              </label>
              <textarea className="input min-h-[90px]" placeholder="Например: закупка сезонного товара к летнему сезону, увеличение оборотных средств" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>

            {error && <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{error}</div>}

            <div className="flex flex-wrap gap-3 pt-2">
              <button className="btn-primary flex-1 py-3 text-base" disabled={busy} onClick={() => create(true)}>
                <IconRocket className="h-5 w-5" />
                {busy ? 'Проверяем и отправляем…' : 'Отправить заявку в банк'}
              </button>
              <button className="btn-ghost px-6" disabled={busy} onClick={() => create(false)}>Сохранить черновик</button>
            </div>
            <p className="text-center text-xs text-gray-400">Нажимая кнопку, вы даете согласие на автоматическую проверку данных в ЕГРЮЛ, ФНС, ГИР БО и БКИ.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense>
      <ApplyForm />
    </Suspense>
  );
}

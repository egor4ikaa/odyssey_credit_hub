'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  IconLogout,
  IconSettings,
  IconUser,
  IconBuilding,
  IconMail,
  IconLock,
  IconX
} from '@/components/icons';

interface Me {
  name: string;
  email: string;
  role: 'CLIENT' | 'OPERATOR';
  inn?: string | null;
}

export function Header() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [innInput, setInnInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        setMe(d.user);
        if (d.user) {
          setNameInput(d.user.name || '');
          setEmailInput(d.user.email || '');
          setInnInput(d.user.inn || '');
        }
      })
      .catch(() => setMe(null));
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput,
          email: emailInput,
          inn: innInput,
          password: passwordInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setMe(data.user);
      setMsg('Профиль успешно обновлён');
      setPasswordInput('');
      setTimeout(() => setProfileOpen(false), 1200);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  const homeLink = me ? (me.role === 'OPERATOR' ? '/backoffice' : '/dashboard') : '/';

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-brand-500/10 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href={homeLink} className="flex items-center gap-3 transition hover:opacity-80">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 font-display text-sm font-extrabold text-white shadow-glow">
              O
            </span>
            <span className="font-display text-sm font-bold tracking-tight text-gray-900">
              ODYSSEY <span className="text-brand-500">КРЕДИТ ХАБ</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {me && (
              <>
                <button
                  onClick={() => setProfileOpen(true)}
                  className="hidden items-center gap-2 rounded-2xl px-3 py-1.5 transition hover:bg-brand-500/5 sm:flex"
                  title="Личный профиль"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
                    <IconUser className="h-4 w-4" />
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-semibold leading-tight text-gray-900">{me.name}</span>
                    <span className="block text-xs leading-tight text-gray-500">
                      {me.role === 'OPERATOR' ? 'Кредитный специалист' : 'Предприниматель'}
                    </span>
                  </span>
                  <IconSettings className="h-3.5 w-3.5 text-gray-400" />
                </button>

                {me.role === 'OPERATOR' && (
                  <Link href="/backoffice" className="btn-ghost !px-4 !py-2 text-sm">Бэкофис</Link>
                )}
                <button onClick={logout} className="btn-ghost !px-4 !py-2 text-sm" title="Выйти">
                  <IconLogout className="h-4 w-4" />
                  <span className="hidden sm:inline">Выйти</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Profile Edit Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-gray-900">Личный профиль</h3>
              <button
                onClick={() => setProfileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Закрыть"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <IconUser className="h-3.5 w-3.5 text-gray-400" /> Имя / ФИО
                </label>
                <input className="input" value={nameInput} onChange={(e) => setNameInput(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <IconMail className="h-3.5 w-3.5 text-gray-400" /> Email
                </label>
                <input className="input" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <IconBuilding className="h-3.5 w-3.5 text-gray-400" /> ИНН компании / ИП
                </label>
                <input
                  className="input"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="7701234567"
                  value={innInput}
                  onChange={(e) => setInnInput(e.target.value.replace(/\D/g, ''))}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  ИНН подставляется в заявки автоматически; карточка компании создаётся по данным ЕГРЮЛ/ФНС.
                </p>
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <IconLock className="h-3.5 w-3.5 text-gray-400" /> Новый пароль (оставьте пустым, если не меняете)
                </label>
                <input className="input" type="password" placeholder="••••••••" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
              </div>

              {msg && <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{msg}</div>}

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setProfileOpen(false)} className="btn-ghost">
                  Отмена
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

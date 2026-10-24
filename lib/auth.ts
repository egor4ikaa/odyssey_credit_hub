import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me-please-32ch';

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 32).toString('hex');
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(pw, salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(userId).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token?: string): string | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return Buffer.from(payload, 'base64url').toString();
}

export async function currentUser() {
  const store = await cookies();
  const userId = verifySessionToken(store.get('session')?.value);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireUser(role?: 'CLIENT' | 'OPERATOR') {
  const user = await currentUser();
  if (!user) throw new HttpError(401, 'Не авторизован');
  if (role && user.role !== role) throw new HttpError(403, 'Недостаточно прав');
  return user;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function validatePassword(password: string): string | null {
  if (password.length < 10) return 'Пароль должен содержать не менее 10 символов.';
  if (!/[A-ZА-Я]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную букву.';
  if (!/[a-zа-я]/.test(password)) return 'Пароль должен содержать хотя бы одну строчную букву.';
  if (!/[!*_\-@]/.test(password)) return 'Пароль должен содержать хотя бы один специальный знак (!, *, _, -, @).';
  return null;
}

export function validateFullName(name: string): string | null {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return 'Пожалуйста, введите Фамилию и Имя (минимум 2 слова).';
  return null;
}

export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Введите корректный email адрес.';
  return null;
}

export function validatePhone(phone: string): string | null {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10 || clean.length > 12) return 'Телефон должен содержать от 10 до 12 цифр.';
  return null;
}

export function validateInn(inn: string): string | null {
  const clean = inn.replace(/\D/g, '');
  if (clean.length !== 10 && clean.length !== 12) return 'ИНН должен содержать ровно 10 или 12 цифр.';
  return null;
}

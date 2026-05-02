import { ADMIN_SESSION_KEY } from '@/services/inventory/constants';

export function isAdminSessionActive(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

export function setAdminSessionActive(active: boolean): void {
  if (active) sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
  else sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function getAdminPassword(): string {
  return import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin123';
}

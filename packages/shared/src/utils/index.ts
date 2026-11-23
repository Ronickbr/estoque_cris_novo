export function formatCurrency(value: number, currency = 'BRL', locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value / 100);
}

export function formatDate(date: string | Date, locale = 'pt-BR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date, locale = 'pt-BR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const parsed = Number(value.replace(/[^\d.,-]/g, '').replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;
  
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(clean[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(clean[12])) return false;
  
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(clean[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === parseInt(clean[13]);
}

export function getStockStatus(
  current: number,
  min: number,
  max: number
): 'critical' | 'low' | 'ok' | 'overstock' {
  if (current <= 0) return 'critical';
  if (current < min) return 'low';
  if (current > max) return 'overstock';
  return 'ok';
}

export function getStockStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    critical: 'Crítico',
    low: 'Baixo',
    ok: 'OK',
    overstock: 'Excesso',
  };
  return labels[status] || status;
}

export function getStockStatusColor(status: string): string {
  const colors: Record<string, string> = {
    critical: 'danger',
    low: 'warning',
    ok: 'success',
    overstock: 'info',
  };
  return colors[status] || 'secondary';
}
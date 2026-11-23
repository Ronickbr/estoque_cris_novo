import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(value: number | string, options?: Intl.NumberFormatOptions): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('pt-BR', options).format(num);
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'agora mesmo';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours} h atrás`;
  if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  return formatDate(d);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
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

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStockStatus(stock: number, minStock: number, maxStock?: number): 'normal' | 'low' | 'critical' | 'out_of_stock' | 'overstock' {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= minStock * 0.5) return 'critical';
  if (stock <= minStock) return 'low';
  if (maxStock && stock > maxStock) return 'overstock';
  return 'normal';
}

export function getStockStatusColor(status: string): string {
  switch (status) {
    case 'normal': return 'success';
    case 'low': return 'warning';
    case 'critical': return 'danger';
    case 'out_of_stock': return 'danger';
    case 'overstock': return 'info';
    default: return 'secondary';
  }
}

export function getStockStatusLabel(status: string): string {
  switch (status) {
    case 'normal': return 'Normal';
    case 'low': return 'Baixo';
    case 'critical': return 'Crítico';
    case 'out_of_stock': return 'Esgotado';
    case 'overstock': return 'Excedente';
    default: return 'Desconhecido';
  }
}

export function getMovementTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    entry: 'Entrada',
    exit: 'Saída',
    transfer: 'Transferência',
    adjustment: 'Ajuste',
    return: 'Devolução',
    loss: 'Perda',
  };
  return labels[type] || type;
}

export function getMovementTypeColor(type: string): string {
  const colors: Record<string, string> = {
    entry: 'success',
    exit: 'danger',
    transfer: 'info',
    adjustment: 'warning',
    return: 'primary',
    loss: 'dark',
  };
  return colors[type] || 'secondary';
}

export function getUserRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    usuario: 'Usuário',
    operator: 'Operador',
    viewer: 'Visualizador',
  };
  return labels[role] || role;
}

export function getUserRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: 'danger',
    usuario: 'primary',
    operator: 'primary',
    viewer: 'secondary',
  };
  return colors[role] || 'secondary';
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  return fn().catch((error) => {
    if (retries <= 0) throw error;
    return sleep(delay).then(() => retry(fn, retries - 1, delay * 2));
  });
}

export type UserRole = 'admin' | 'operator' | 'viewer';
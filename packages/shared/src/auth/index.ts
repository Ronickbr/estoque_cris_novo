import { NeonAuthConfig } from '../types';

export function getNeonAuthConfig(): NeonAuthConfig {
  return {
    baseUrl: process.env.NEON_AUTH_BASE_URL || '',
    jwksUrl: process.env.NEON_AUTH_JWKS_URL || '',
    audience: process.env.NEON_AUTH_AUDIENCE || 'neondb',
    issuer: process.env.NEON_AUTH_ISSUER || '',
  };
}

export function isNeonAuthConfigured(): boolean {
  const config = getNeonAuthConfig();
  return !!(config.baseUrl && config.jwksUrl && config.audience && config.issuer);
}

export function getAuthHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;
  const exp = payload.exp as number;
  const now = Math.floor(Date.now() / 1000);
  return exp - bufferSeconds < now;
}

export function getTokenExpiry(token: string): Date | null {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return null;
  return new Date((payload.exp as number) * 1000);
}

export function getUserIdFromToken(token: string): string | null {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.sub) return null;
  return payload.sub as string;
}

export function getUserRoleFromToken(token: string): string | null {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.role) return null;
  return payload.role as string;
}

export function getUserEmailFromToken(token: string): string | null {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.email) return null;
  return payload.email as string;
}
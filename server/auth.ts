import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

const RUNTIME_JWT_FALLBACK = crypto.randomBytes(32).toString('hex');

function getJwtSecret(): string {
  const configured = process.env.JWT_SECRET?.trim();
  return configured && configured.length >= 16 ? configured : RUNTIME_JWT_FALLBACK;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    if (
      typeof decoded.sub === 'string' &&
      typeof decoded.email === 'string' &&
      typeof decoded.name === 'string' &&
      (decoded.role === 'customer' || decoded.role === 'admin')
    ) {
      return {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function safeComparePasscode(input: string, expected: string): boolean {
  const inputDigest = crypto.createHash('sha256').update(input).digest();
  const expectedDigest = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(inputDigest, expectedDigest);
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (token) {
    const payload = verifyAuthToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });
    return;
  }
  req.user = payload;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  const payload = verifyAuthToken(token);
  if (!payload || payload.role !== 'admin') {
    res.status(403).json({ error: 'Admin privileges are required for this action.' });
    return;
  }
  req.user = payload;
  next();
}

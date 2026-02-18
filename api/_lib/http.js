import { randomBytes } from 'node:crypto';

export const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

export const redirect = (res, location, statusCode = 302) => {
  res.statusCode = statusCode;
  res.setHeader('Location', location);
  res.end();
};

export const html = (res, statusCode, body) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(body);
};

export const readJsonBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;

  if (typeof req.body === 'string') {
    return req.body.length ? JSON.parse(req.body) : {};
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
};

export const parseCookies = (req) => {
  const header = req.headers?.cookie;
  if (!header) return {};

  const result = {};
  header.split(';').forEach((segment) => {
    const trimmed = segment.trim();
    if (!trimmed) return;
    const eq = trimmed.indexOf('=');
    if (eq < 0) return;
    const key = decodeURIComponent(trimmed.slice(0, eq));
    const value = decodeURIComponent(trimmed.slice(eq + 1));
    result[key] = value;
  });
  return result;
};

const appendSetCookie = (res, cookieValue) => {
  const previous = res.getHeader('Set-Cookie');
  if (!previous) {
    res.setHeader('Set-Cookie', cookieValue);
    return;
  }

  if (Array.isArray(previous)) {
    res.setHeader('Set-Cookie', [...previous, cookieValue]);
    return;
  }

  res.setHeader('Set-Cookie', [previous, cookieValue]);
};

export const setCookie = (res, name, value, options = {}) => {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  const path = options.path || '/';
  parts.push(`Path=${path}`);

  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push('Secure');

  appendSetCookie(res, parts.join('; '));
};

export const clearCookie = (res, name, options = {}) => {
  setCookie(res, name, '', {
    path: options.path || '/',
    maxAge: 0,
    sameSite: options.sameSite || 'Lax',
    secure: options.secure,
  });
};

export const getRequestOrigin = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = forwardedHost || req.headers.host;
  const proto = forwardedProto || 'https';
  return `${proto}://${host}`;
};

export const randomState = () => randomBytes(18).toString('base64url');

export const parseQuery = (req) => {
  const origin = getRequestOrigin(req);
  const url = new URL(req.url, origin);
  return url.searchParams;
};

export const allowMethods = (req, res, methods) => {
  if (methods.includes(req.method)) return true;
  res.statusCode = 405;
  res.setHeader('Allow', methods.join(', '));
  res.end('Method Not Allowed');
  return false;
};

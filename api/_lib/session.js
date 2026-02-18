import { createHmac } from 'node:crypto';
import { clearCookie, parseCookies, setCookie } from './http.js';

export const SESSION_COOKIE = 'bobg_cms_session';
export const OAUTH_STATE_COOKIE = 'bobg_cms_oauth_state';
export const DRAFT_BRANCH_COOKIE = 'bobg_cms_draft_branch';

const sign = (value, secret) => createHmac('sha256', secret).update(value).digest('base64url');

const encodePayload = (payload) => Buffer.from(JSON.stringify(payload)).toString('base64url');

const decodePayload = (value) => {
  const raw = Buffer.from(value, 'base64url').toString('utf8');
  return JSON.parse(raw);
};

export const createSessionToken = (payload, secret) => {
  const encoded = encodePayload(payload);
  const signature = sign(encoded, secret);
  return `${encoded}.${signature}`;
};

export const parseSessionToken = (token, secret) => {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expected = sign(encoded, secret);
  if (signature !== expected) return null;

  let payload;
  try {
    payload = decodePayload(encoded);
  } catch {
    return null;
  }

  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.exp !== 'number' || payload.exp <= Date.now()) return null;
  return payload;
};

export const setSessionCookie = (res, payload, config, maxAgeSec = 60 * 60 * 8) => {
  const token = createSessionToken(payload, config.authSecret);
  setCookie(res, SESSION_COOKIE, token, {
    path: '/',
    maxAge: maxAgeSec,
    sameSite: 'Lax',
    secure: config.isSecureCookie,
    httpOnly: true,
  });
};

export const clearSessionCookie = (res, config) => {
  clearCookie(res, SESSION_COOKIE, {
    path: '/',
    sameSite: 'Lax',
    secure: config.isSecureCookie,
  });
};

export const setOAuthStateCookie = (res, state, config) => {
  setCookie(res, OAUTH_STATE_COOKIE, state, {
    path: '/',
    maxAge: 60 * 10,
    sameSite: 'Lax',
    secure: config.isSecureCookie,
    httpOnly: true,
  });
};

export const clearOAuthStateCookie = (res, config) => {
  clearCookie(res, OAUTH_STATE_COOKIE, {
    path: '/',
    sameSite: 'Lax',
    secure: config.isSecureCookie,
  });
};

export const getOAuthStateFromRequest = (req) => {
  const cookies = parseCookies(req);
  return cookies[OAUTH_STATE_COOKIE] || '';
};

export const setDraftBranchCookie = (res, branch, config) => {
  setCookie(res, DRAFT_BRANCH_COOKIE, branch, {
    path: '/',
    maxAge: 60 * 60 * 12,
    sameSite: 'Lax',
    secure: config.isSecureCookie,
    httpOnly: true,
  });
};

export const clearDraftBranchCookie = (res, config) => {
  clearCookie(res, DRAFT_BRANCH_COOKIE, {
    path: '/',
    sameSite: 'Lax',
    secure: config.isSecureCookie,
  });
};

export const getDraftBranchFromRequest = (req) => {
  const cookies = parseCookies(req);
  return cookies[DRAFT_BRANCH_COOKIE] || '';
};

export const getSession = (req, config) => {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE] || '';
  return parseSessionToken(token, config.authSecret);
};

export const isAllowedLogin = (login, config) => {
  if (!login) return false;
  if (!config.allowlist.length) return true;
  return config.allowlist.includes(login.toLowerCase());
};

import { assertConfig, getConfig } from '../_lib/config.js';
import { getRequestOrigin, html, parseQuery, redirect } from '../_lib/http.js';
import {
  clearDraftBranchCookie,
  clearOAuthStateCookie,
  clearSessionCookie,
  getOAuthStateFromRequest,
  isAllowedLogin,
  setSessionCookie,
} from '../_lib/session.js';

const exchangeCode = async ({ code, state, config, redirectUri }) => {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.githubClientId,
      client_secret: config.githubClientSecret,
      code,
      state,
      redirect_uri: redirectUri,
    }),
  });

  const payload = await response.json();
  if (!response.ok || payload.error || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'OAuth token exchange failed');
  }

  return payload.access_token;
};

const fetchGithubUser = async (accessToken) => {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'bobg-cms',
    },
  });

  const payload = await response.json();
  if (!response.ok || !payload?.login) {
    throw new Error(payload?.message || 'failed to fetch GitHub user profile');
  }

  return payload;
};

export default async function handler(req, res) {
  try {
    const config = getConfig();
    assertConfig(config);

    const query = parseQuery(req);
    const code = query.get('code') || '';
    const state = query.get('state') || '';
    const stateCookie = getOAuthStateFromRequest(req);

    if (!code || !state || !stateCookie || state !== stateCookie) {
      clearOAuthStateCookie(res, config);
      clearSessionCookie(res, config);
      clearDraftBranchCookie(res, config);
      html(res, 400, '<h1>Invalid OAuth state</h1>');
      return;
    }

    const origin = getRequestOrigin(req);
    const redirectUri = config.oauthRedirectUri || `${origin}/api/auth/callback`;
    const accessToken = await exchangeCode({ code, state, config, redirectUri });
    const profile = await fetchGithubUser(accessToken);

    if (!isAllowedLogin(profile.login, config)) {
      clearOAuthStateCookie(res, config);
      clearSessionCookie(res, config);
      clearDraftBranchCookie(res, config);
      html(
        res,
        403,
        `<h1>Access denied</h1><p>${profile.login} is not in CMS_ALLOWLIST.</p>`,
      );
      return;
    }

    const sessionPayload = {
      login: profile.login,
      accessToken,
      exp: Date.now() + 1000 * 60 * 60 * 8,
    };

    setSessionCookie(res, sessionPayload, config);
    clearOAuthStateCookie(res, config);
    redirect(res, '/admin/');
  } catch (error) {
    html(res, 500, `<h1>OAuth callback failed</h1><pre>${error.message}</pre>`);
  }
}

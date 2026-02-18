import { assertConfig, getConfig } from '../_lib/config.js';
import { getRequestOrigin, randomState, redirect } from '../_lib/http.js';
import { setOAuthStateCookie } from '../_lib/session.js';

export default async function handler(req, res) {
  try {
    const config = getConfig();
    assertConfig(config);

    const state = randomState();
    setOAuthStateCookie(res, state, config);

    const origin = getRequestOrigin(req);
    const redirectUri = config.oauthRedirectUri || `${origin}/api/auth/callback`;

    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
    authorizeUrl.searchParams.set('client_id', config.githubClientId);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', 'read:user repo');
    authorizeUrl.searchParams.set('state', state);

    redirect(res, authorizeUrl.toString());
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`OAuth init failed: ${error.message}`);
  }
}

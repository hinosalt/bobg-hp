import { getConfig } from './_lib/config.js';
import { allowMethods, json } from './_lib/http.js';
import { getDraftBranchFromRequest, getSession, isAllowedLogin } from './_lib/session.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  const config = getConfig();
  const session = getSession(req, config);
  if (!session || !session.login) {
    json(res, 200, { authenticated: false });
    return;
  }

  const allowed = isAllowedLogin(session.login, config);
  json(res, 200, {
    authenticated: true,
    login: session.login,
    allowed,
    branch: getDraftBranchFromRequest(req) || null,
  });
}

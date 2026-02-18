import { getConfig } from '../_lib/config.js';
import { redirect } from '../_lib/http.js';
import { clearDraftBranchCookie, clearOAuthStateCookie, clearSessionCookie } from '../_lib/session.js';

export default async function handler(req, res) {
  const config = getConfig();
  clearOAuthStateCookie(res, config);
  clearSessionCookie(res, config);
  clearDraftBranchCookie(res, config);
  redirect(res, '/admin/');
}

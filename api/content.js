import { getConfig } from './_lib/config.js';
import { getRepoFile } from './_lib/github.js';
import { allowMethods, json } from './_lib/http.js';
import { getSession, isAllowedLogin } from './_lib/session.js';

const CONTENT_PATH = 'content/site-content.json';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  const config = getConfig();
  const session = getSession(req, config);
  if (!session || !isAllowedLogin(session.login, config)) {
    json(res, 401, { error: 'unauthorized' });
    return;
  }

  try {
    const file = await getRepoFile(
      config.owner,
      config.repo,
      CONTENT_PATH,
      config.baseBranch,
      session.accessToken,
    );

    if (!file?.content) {
      json(res, 404, { error: 'content file not found' });
      return;
    }

    const decoded = Buffer.from(file.content, 'base64').toString('utf8');
    const content = JSON.parse(decoded);

    json(res, 200, {
      content,
      sha: file.sha,
      branch: config.baseBranch,
      path: CONTENT_PATH,
    });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
}

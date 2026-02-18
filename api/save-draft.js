import { getConfig } from './_lib/config.js';
import {
  createPullRequest,
  ensureBranch,
  findOpenPullRequest,
  getRepoFile,
  putRepoFile,
} from './_lib/github.js';
import { allowMethods, json, readJsonBody } from './_lib/http.js';
import {
  getDraftBranchFromRequest,
  getSession,
  isAllowedLogin,
  setDraftBranchCookie,
} from './_lib/session.js';
import { validateSiteContentPayload } from './_lib/siteContent.js';

const CONTENT_PATH = 'content/site-content.json';

const timestampTag = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const safeSegment = (value, fallback) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
};

const buildBranchName = (login) => {
  const owner = safeSegment(login, 'editor').slice(0, 20);
  return `cms/${timestampTag()}-${owner}`;
};

const makePrBody = (sessionLogin, branch) => [
  '## CMS Content Update',
  '',
  `- Editor: ${sessionLogin}`,
  `- Branch: ${branch}`,
  `- Updated at: ${new Date().toISOString()}`,
  '',
  'This PR was generated from the BOBG CMS admin panel.',
].join('\n');

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  const config = getConfig();
  const session = getSession(req, config);
  if (!session || !isAllowedLogin(session.login, config)) {
    json(res, 401, { error: 'unauthorized' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const content = body.content;
    validateSiteContentPayload(content);

    const branch = String(body.branch || '').trim() || getDraftBranchFromRequest(req) || buildBranchName(session.login);

    await ensureBranch(config.owner, config.repo, config.baseBranch, branch, session.accessToken);

    const nextContent = {
      ...content,
      updatedAt: new Date().toISOString(),
      updatedBy: session.login,
    };

    const existing = await getRepoFile(
      config.owner,
      config.repo,
      CONTENT_PATH,
      branch,
      session.accessToken,
    );

    await putRepoFile({
      owner: config.owner,
      repo: config.repo,
      filePath: CONTENT_PATH,
      branch,
      token: session.accessToken,
      message: 'cms: update site content',
      contentBase64: Buffer.from(JSON.stringify(nextContent, null, 2) + '\n', 'utf8').toString('base64'),
      sha: existing?.sha,
    });

    let pull = await findOpenPullRequest(
      config.owner,
      config.repo,
      branch,
      config.baseBranch,
      session.accessToken,
    );

    if (!pull) {
      pull = await createPullRequest({
        owner: config.owner,
        repo: config.repo,
        branch,
        baseBranch: config.baseBranch,
        token: session.accessToken,
        title: body.title || `CMS: content update by ${session.login}`,
        body: makePrBody(session.login, branch),
      });
    }

    setDraftBranchCookie(res, branch, config);

    json(res, 200, {
      ok: true,
      branch,
      prNumber: pull.number,
      prUrl: pull.html_url,
    });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
}

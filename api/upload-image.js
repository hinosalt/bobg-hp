import { getConfig } from './_lib/config.js';
import { ensureBranch, putRepoFile } from './_lib/github.js';
import { allowMethods, json, readJsonBody } from './_lib/http.js';
import {
  getDraftBranchFromRequest,
  getSession,
  isAllowedLogin,
  setDraftBranchCookie,
} from './_lib/session.js';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

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

const findExtension = (filename) => {
  const lower = filename.toLowerCase();
  const idx = lower.lastIndexOf('.');
  if (idx < 0) return '';
  return lower.slice(idx);
};

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
    const locale = safeSegment(body.locale, 'ja');
    const section = safeSegment(body.section, 'misc');
    const fileBase64 = String(body.fileBase64 || '');
    const originalFilename = String(body.filename || 'upload.png');

    if (!['ja', 'en'].includes(locale)) {
      json(res, 400, { error: 'invalid locale' });
      return;
    }

    const extension = findExtension(originalFilename);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      json(res, 400, { error: 'unsupported file extension' });
      return;
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    if (!buffer.length) {
      json(res, 400, { error: 'empty file payload' });
      return;
    }
    if (buffer.length > MAX_BYTES) {
      json(res, 400, { error: 'file size exceeds 8MB limit' });
      return;
    }

    const seed = safeSegment(originalFilename.replace(extension, ''), 'image').slice(0, 36);
    const filename = `${timestampTag()}-${seed}${extension}`;
    const targetPath = `source/uploads/${locale}/${section}/${filename}`;

    const requestedBranch = String(body.branch || '').trim();
    const cookieBranch = getDraftBranchFromRequest(req);
    const branch = requestedBranch || cookieBranch || buildBranchName(session.login);

    await ensureBranch(config.owner, config.repo, config.baseBranch, branch, session.accessToken);

    await putRepoFile({
      owner: config.owner,
      repo: config.repo,
      filePath: targetPath,
      branch,
      token: session.accessToken,
      message: `cms: upload asset ${filename}`,
      contentBase64: buffer.toString('base64'),
    });

    setDraftBranchCookie(res, branch, config);
    json(res, 200, {
      ok: true,
      branch,
      path: targetPath,
    });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
}

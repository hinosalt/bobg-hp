const GH_API = 'https://api.github.com';

const encodePath = (filePath) => filePath.split('/').map(encodeURIComponent).join('/');

export const githubRequest = async (pathname, { token, method = 'GET', body } = {}) => {
  const response = await fetch(`${GH_API}${pathname}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'bobg-cms',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || `${response.status} ${response.statusText}`;
    const error = new Error(`GitHub API request failed: ${message}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const getBranchSha = async (owner, repo, branch, token) => {
  const data = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`, {
    token,
  });
  return data?.object?.sha;
};

export const ensureBranch = async (owner, repo, baseBranch, branch, token) => {
  try {
    const sha = await getBranchSha(owner, repo, branch, token);
    if (sha) return sha;
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  const baseSha = await getBranchSha(owner, repo, baseBranch, token);
  await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
    token,
    method: 'POST',
    body: {
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    },
  });

  return baseSha;
};

export const getRepoFile = async (owner, repo, filePath, ref, token) => {
  try {
    return await githubRequest(
      `/repos/${owner}/${repo}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(ref)}`,
      { token },
    );
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
};

export const putRepoFile = async ({ owner, repo, filePath, branch, token, message, contentBase64, sha }) => githubRequest(
  `/repos/${owner}/${repo}/contents/${encodePath(filePath)}`,
  {
    token,
    method: 'PUT',
    body: {
      message,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {}),
    },
  },
);

export const findOpenPullRequest = async (owner, repo, headBranch, baseBranch, token) => {
  const pulls = await githubRequest(
    `/repos/${owner}/${repo}/pulls?state=open&head=${encodeURIComponent(`${owner}:${headBranch}`)}&base=${encodeURIComponent(baseBranch)}`,
    { token },
  );

  if (!Array.isArray(pulls) || pulls.length === 0) return null;
  return pulls[0];
};

export const createPullRequest = async ({ owner, repo, branch, baseBranch, token, title, body }) => githubRequest(
  `/repos/${owner}/${repo}/pulls`,
  {
    token,
    method: 'POST',
    body: {
      title,
      head: branch,
      base: baseBranch,
      body,
    },
  },
);

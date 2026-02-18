export const getConfig = () => {
  const owner = process.env.GITHUB_OWNER || 'hinosalt';
  const repo = process.env.GITHUB_REPO || 'bobg-hp';
  const baseBranch = process.env.GITHUB_BASE_BRANCH || 'main';
  const allowlist = (process.env.CMS_ALLOWLIST || 'hinosalt')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return {
    owner,
    repo,
    baseBranch,
    githubClientId: process.env.GITHUB_ID || '',
    githubClientSecret: process.env.GITHUB_SECRET || '',
    oauthRedirectUri: process.env.CMS_OAUTH_REDIRECT_URI || '',
    authSecret: process.env.AUTH_SECRET || '',
    allowlist,
    isSecureCookie: process.env.NODE_ENV === 'production',
  };
};

export const assertConfig = (config) => {
  const required = ['githubClientId', 'githubClientSecret', 'authSecret'];
  required.forEach((key) => {
    if (!config[key]) {
      throw new Error(`missing environment variable for ${key}`);
    }
  });
};

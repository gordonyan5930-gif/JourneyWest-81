// Vercel Ignored Build Step: exit 0 skips; exit 1 permits a build.
// Missing metadata fails closed. Authentication is a separate PROJECT setting.
const allowed = process.env.VERCEL_ENV === 'preview'
  && process.env.VERCEL_GIT_COMMIT_REF === 'feat/p0-a-prototype';
console.log(allowed ? 'Build permitted: P0-A preview branch.' : 'Build skipped: only the P0-A preview branch is allowed.');
process.exit(allowed ? 1 : 0);

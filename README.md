# bobg_hp

`/Users/hinosorarto/Desktop/AI/bobg_hp` contains the renewed BOBG homepage implementation.

## Constraints
- Source elements are quoted into HTML components via extracted manifest data (`94 texts`, `40 images`).
- Brand color is fixed to `#17184B`.
- Runtime rendering reads editable data from `content/site-content.json`.

## Source of Truth
- `/Users/hinosorarto/Downloads/bobg_HP_image`
- Copied into `source/raw/` as:
  - `bobg-ja-page.svg`
  - `bobg-ja-components.svg`
  - `bobg-en-page.svg`
  - `bobg-en-components.svg`
  - `bobg.fig`
- Rendered element manifest:
  - `source/manifest/bobg-rendered-content.json`
  - `source/manifest/bobg-text-order.txt`
  - `source/manifest/bobg-image-order.txt`

## Commands
- Dev server: `npm run dev`
- Build manifest: `npm run build:manifest`
- Build initial site content from current script constants: `npm run build:site-content`
- Validate editable content schema: `npm run validate:site-content`
- Integrity test: `npm run test:integrity`
- E2E smoke test: `npm run test:e2e`
- Fast gate: `npm run fast-check`
- Full gate: `npm run check`

## Local validation flow
1. `npm run check`
2. `npm run dev`
3. Open:
- `http://127.0.0.1:4173/`
- `http://127.0.0.1:4173/en/`
4. Verify that both pages render:
- Sticky 2-layer header
- Quoted text/image elements (no `<object>` SVG embedding)
- Sections: project/news/services/member/contact
- Scroll reveal animations

## Inquiry / Material Request Mail
- Both forms (`contact` section and footer CTA modal) require all required fields before submission.
- Submission is sent via `https://formsubmit.co/ajax/info@bobg.xyz`.
- Mail is delivered to `info@bobg.xyz` in table format with inquiry type, locale, and timestamp.
- Internet connectivity is required for form submission.

## CMS Admin
- Admin UI path: `/admin/`
- Auth flow: `GET /api/auth/start` -> GitHub OAuth -> `/api/auth/callback`
- Session API: `GET /api/session`
- Content API: `GET /api/content`
- Upload API: `POST /api/upload-image`
- Draft save API: `POST /api/save-draft` (creates/updates PR)

### Deploy (GitHub + Vercel)
1. Push this directory to a GitHub repository (for example: `hinosalt/bobg-hp`).
2. Import the repository on Vercel as a new project.
3. Create a GitHub OAuth App:
- Homepage URL: your Vercel production URL
- Authorization callback URL: `https://<your-domain>/api/auth/callback`
4. Set Vercel Environment Variables listed below.
5. Deploy and open:
- Public site: `https://<your-domain>/`
- Admin: `https://<your-domain>/admin/`

### Why not GitHub Pages only
- GitHub Pages can host static files, but this CMS needs server-side API routes (`/api/*`) for OAuth, upload, and PR creation.
- Use Vercel (or another serverless host) for CMS APIs.

### Required environment variables (Vercel)
- `GITHUB_ID` (OAuth App client id)
- `GITHUB_SECRET` (OAuth App client secret)
- `AUTH_SECRET` (cookie sign secret)
- `CMS_ALLOWLIST` (comma-separated GitHub logins)
- `GITHUB_OWNER` (default: `hinosalt`)
- `GITHUB_REPO` (default: `bobg-hp`)
- `GITHUB_BASE_BRANCH` (default: `main`)
- `CMS_OAUTH_REDIRECT_URI` (optional; defaults to `/api/auth/callback`)

## Notes
- The environment could not resolve `registry.npmjs.org` on February 18, 2026; implementation is dependency-free and fully offline-runnable.

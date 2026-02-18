# bobg_hp

`/Users/hinosorarto/Desktop/AI/bobg_hp` contains the renewed BOBG homepage implementation.

## Constraints
- Text and image elements from source assets are not edited.
- Source elements are quoted into HTML components via extracted manifest data (`94 texts`, `40 images`).
- Brand color is fixed to `#17184B`.

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

## Notes
- The environment could not resolve `registry.npmjs.org` on February 18, 2026; implementation is dependency-free and fully offline-runnable.

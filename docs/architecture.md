# Architecture

## Overview
- 構成は「ソース資産層」「要素マニフェスト層」「公開UI層」「CMS管理層」「検証層」の5層。
- 要件の中核は「要素引用 + 管理画面編集 + PRベース公開」。

## Components
- `source/raw/*`
  - 正規ソース資産（JA/ENのpage/components SVG + FIG）。
- `scripts/build_manifest.mjs`
  - SVGからタグ/要素数/リンク/ハッシュを抽出してマニフェスト化。
- `source/manifest/source-manifest.json`
  - 不変性検証の基準データ。
- `source/manifest/bobg-rendered-content.json`
  - 文字94件・画像40件の引用元データ。
- `content/site-content.json`
  - 公開UIの編集可能データ（JA/EN text/image/url + modal/contact copy）。
- `index.html`, `en/index.html`, `styles.css`, `script.js`
  - リニューアルUI。`site-content.json` を優先して描画。
- `admin/index.html`, `admin/admin.js`, `admin/admin.css`
  - 編集管理画面（JA/EN同時編集、画像アップロード、PR保存）。
- `api/*.js`
  - GitHub OAuth、セッション、コンテンツ取得、画像アップロード、PR作成API。
- `scripts/check_integrity.mjs`
  - マニフェストと実ファイルの一致検証。
- `scripts/validate_site_content.mjs`
  - `content/site-content.json` の構造・件数検証。
- `scripts/build_site_content.mjs`
  - 既存定数 + マニフェストから `site-content.json` を初期生成。
- `scripts/test_e2e_smoke.mjs`
  - ローカル静的サーバー上でJA/ENページ配信と埋め込み参照をスモーク検証。

## Data Flow
1. 入力: `source/raw/*.svg` / `source/raw/bobg.fig`
2. 処理:
- `build_manifest` がハッシュ・要素数・リンク情報を抽出
- `script.js` が `bobg-rendered-content.json` と `content/site-content.json` を読み、公開UIへ反映
- 管理画面が `/api/*` 経由で GitHub ブランチへ更新し、PRを生成
- `validate_site_content` / `check_integrity` / `test_e2e_smoke` が検証
3. 出力:
- `source/manifest/source-manifest.json`
- `content/site-content.json`
- ローカル表示可能なJA/ENリニューアルページ
- PRベースで公開可能なCMS更新フロー

## Interfaces
- 外部: なし（オフライン完結）
- 内部:
  - `npm run build:manifest`
  - `npm run build:site-content`
  - `npm run validate:site-content`
  - `npm run test:integrity`
  - `npm run test:e2e`
  - `npm run check`

## 注意
- ソースSVGを直接埋め込まず、抽出済み要素（文字・画像）をDOMへ引用する。
- 管理画面APIの本番運用は Vercel 環境変数（OAuth/secret）を必須とする。

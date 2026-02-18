# Architecture

## Overview
- 構成は「ソース資産層」「要素マニフェスト層」「UI層」「検証層」の4層。
- 要件の中核は「不変要素引用 + 自動整合性チェック」。

## Components
- `source/raw/*`
  - 正規ソース資産（JA/ENのpage/components SVG + FIG）。
- `scripts/build_manifest.mjs`
  - SVGからタグ/要素数/リンク/ハッシュを抽出してマニフェスト化。
- `source/manifest/source-manifest.json`
  - 不変性検証の基準データ。
- `source/manifest/bobg-rendered-content.json`
  - 文字94件・画像40件の引用元データ。
- `index.html`, `en/index.html`, `styles.css`, `script.js`
  - リニューアルUI。要素引用レンダリングによるFast Retailing風の2層ヘッダーと整理されたセクション構造。
- `scripts/check_integrity.mjs`
  - マニフェストと実ファイルの一致検証。
- `scripts/test_e2e_smoke.mjs`
  - ローカル静的サーバー上でJA/ENページ配信と埋め込み参照をスモーク検証。

## Data Flow
1. 入力: `source/raw/*.svg` / `source/raw/bobg.fig`
2. 処理:
- `build_manifest` がハッシュ・要素数・リンク情報を抽出
- `script.js` が `bobg-rendered-content.json` を読んで94 text / 40 image をHTMLへ引用
- `check_integrity` と `test_e2e_smoke` が検証
3. 出力:
- `source/manifest/source-manifest.json`
- ローカル表示可能なJA/ENリニューアルページ

## Interfaces
- 外部: なし（オフライン完結）
- 内部:
  - `npm run build:manifest`
  - `npm run test:integrity`
  - `npm run test:e2e`
  - `npm run check`

## 注意
- ソースSVGを直接埋め込まず、抽出済み要素（文字・画像）をDOMへ引用する。
- 将来オンライン環境が回復したら、Next.js移行は `docs/decisions.md` の代替案に沿って実施する。

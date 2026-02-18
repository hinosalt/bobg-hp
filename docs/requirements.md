# Requirements

## Context
- 背景: `https://www.bobg.xyz/` を、ミニマルかつUX最適化された構成へ更新する。
- 想定ユーザー: BOBGサイト閲覧者（事業会社、協業先、投資家、候補者）。
- 解決したい課題:
  - 情報の可読性と導線を強化する。
  - Fast Retailing JPのような整理された情報設計を採り入れる。
  - 既存文字/画像要素を改変せずにリニューアルを成立させる。

## Functional Requirements
### Must
- [x] `source/raw/` の元データ（SVG/FIG）を不変で保持する。
- [x] 公開ページは要素引用ベースを維持しつつ、管理画面から text/image/url を編集できる。
- [x] SVG丸ごと埋め込みは行わず、抽出済み要素を引用してHTMLコンポーネントで構成する。
- [x] 引用要素数（94 text / 40 image）を維持する。
- [x] JA/EN 2ページ（`/` と `/en/`）を用意する。
- [x] 2層ヘッダー + セクション構造 + スクロールアニメーションを実装する。
- [x] ブランドカラー `#17184B` を主軸にする。
- [x] マニフェスト生成と整合性検証を自動化する。
- [x] 管理画面（`/admin/`）を実装し、GitHub OAuth認証で編集可能にする。
- [x] 保存はPRベース（下書き→承認公開）で反映する。

### Should
- [x] ソースリンクを可視化し、参照導線を強化する。
- [x] ローカルで自己完結する実行環境にする（依存追加なし）。

### Could
- [ ] Playwrightスクリーンショット自動比較を追加する（ネットワーク復旧後）。

## 受入条件 (Acceptance Criteria)
- [x] Given `source/raw/*.svg` が存在する
  When `npm run build:manifest` を実行する
  Then `source/manifest/source-manifest.json` が生成され、ハッシュ・要素数・リンク情報を持つ。
- [x] Given 生成済みマニフェスト
  When `npm run test:integrity` を実行する
  Then すべてのソースハッシュ/要素数/ページ参照が一致し、`<object>` 埋め込みが存在しない。
- [x] Given ローカル実行環境
  When `npm run test:e2e` を実行する
  Then JA/EN ページとマニフェスト配信が成功し、主要埋め込み参照が検証される。
- [x] Given `content/site-content.json`
  When `npm run validate:site-content` を実行する
  Then JA/ENの text/image/url 構造が件数一致で検証される。
- [x] Given ブラウザ表示
  When `/` と `/en/` を開く
  Then 2層ヘッダー、要素引用セクション、スクロールリビールが確認できる。

## Non-Functional Requirements
- パフォーマンス: 依存ゼロ、静的配信を前提とする。
- 信頼性: 整合性をスクリプトで再現可能に保証する。
- セキュリティ: 機密情報を保持しない。外部リンクは `noopener/noreferrer` を付与する。
- 運用性: `npm run check` で生成→検証→E2Eスモークを一括実行できる。

## 注意
- `registry.npmjs.org` が名前解決不可のため、Next.js導入は現環境で実行不能。
- そのため本実装は「オフラインで要件を満たす最小実装」を採用し、依存追加不要の静的構成とする。

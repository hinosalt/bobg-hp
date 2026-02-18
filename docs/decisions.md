# Decisions Log

## 2026-02-18 Source of truth fixed
- Decision: `/Users/hinosorarto/Downloads/bobg_HP_image` を正規ソースとして固定。
- Rationale: ユーザー指定パスであり、FIGとSVGの両方が揃っているため。
- Alternatives:
  - 公開URLから再取得（不安定）
- Consequences:
  - オフラインで再現可能な検証ラインを構築できる。

## 2026-02-18 Element quoting strategy
- Decision: 文字/画像/要素不変条件を満たしつつ、SVG丸ごと埋め込みを廃止し、抽出済み要素をHTMLへ引用する。
- Rationale: ユーザー要望「svgをそのまま使わない」に対応し、UI再設計の自由度を上げるため。
- Alternatives:
  - ソースSVGの `<object>` 埋め込みを継続
  - スクリーンショット化（要素情報が失われる）
- Consequences:
  - 94 text / 40 image の引用データ維持が品質管理の基準となる。

## 2026-02-18 Offline stack fallback
- Decision: Next.js計画は維持しつつ、現環境では依存解決不可のため静的実装に切替。
- Rationale: `registry.npmjs.org` が ENOTFOUND（2026-02-18）で npm install 不可。
- Alternatives:
  - 実装中断
  - ネットワーク復旧待ち
- Consequences:
  - 今すぐローカル確認可能な成果物を提供できる。
  - 将来オンライン化後のNext.js移行タスクを残す。

## 2026-02-18 Fast Retailing UX transfer rule
- Decision: Fast Retailing JPの「2層ヘッダー」「高密度整理」「罫線分割」「色数制御」を転用。
- Rationale: ミニマルで導線最適化された企業サイト構造を実装しやすい。
- Alternatives:
  - ランダムなLP風デザイン
- Consequences:
  - 企業サイトとしての可読性と整然性が向上する。

## 2026-02-18 News / listing / member photo restoration
- Decision: `project-5(上場実績)` と `news` をDOM上で明確に分離し、`news/core/advisor` の背景画像URLを原本DOMから固定引用する。
- Rationale: 「newsと上場実績が混在」「コアメンバー写真が省略」指摘に対応し、要素省略ゼロを担保するため。
- Alternatives:
  - 40画像マニフェストだけで再構成を継続（欠落が残る）
  - SVG埋め込みに戻す（ユーザー要件違反）
- Consequences:
  - 40画像マニフェスト外の要素（news 3 + core 5 + advisor 6 + header logo 1）を明示的に管理する必要がある。

## 2026-02-18 ZIP reference refinement (jp/en)
- Decision: `/Users/hinosorarto/Downloads/bobg_HP_image/jp.zip` と `en.zip` の内容を参照し、ENロケールのテキスト/リンク/画像差分を実装に反映する。
- Rationale: ユーザー要望「さらに洗練」に対し、原本差分（ENニュース導線、英語文言、画像差分）を正しく再現するため。
- Alternatives:
  - JAデータをENページでも使い続ける（再現性不足）
  - EN差分を無視して見た目のみ調整（要素引用の精度不足）
- Consequences:
  - `script.js` でロケール別マッピング管理が必要になる。
  - `source/quoted/en/` の静的引用画像を保守対象として追加する。

## 2026-02-18 CMS stack without npm dependencies
- Decision: 依存追加なしで `admin/` + `api/`（Vercel Node Functions）+ `content/site-content.json` を実装し、編集結果はPRベースで反映する。
- Rationale: 現環境で `registry.npmjs.org` が解決不可のため、Next.jsや外部ライブラリ前提のCMSを即時導入できない。
- Alternatives:
  - ネットワーク復旧まで実装を停止
  - ローカル専用の手編集運用を継続
- Consequences:
  - GitHub OAuth/allowlistを使った編集権限制御を維持しつつ、運用開始までのリードタイムを短縮できる。
  - サーバーレス実行基盤（Vercel等）が必須となり、GitHub Pages単体ではCMS APIを実行できない。

# Fast Retailing JP Audit (Transfer Notes)

## 対象
- URL: `https://www.fastretailing.com/jp/`
- 参照日: 2026-02-18
- ローカル資料: `bobg_hp_conductor/fastretailing_analysis.json`, `fastretailing_analysis_notes.md`

## 観察結果（転用対象）
1. ヘッダーは2層で役割が分かれる
- 上層: 補助情報（言語/ユーティリティ）
- 下層: ブランド色で強調したグローバルナビ

2. セクション境界は線と余白で整理
- カード化より先に「境界の明快さ」を優先
- 情報密度を上げても可読性を維持

3. タイポと色の抑制
- 色数を絞る（ブランド + モノトーン）
- 見出しと補助文の強弱を明確化

4. フッターで導線を回収
- 主要ページで伝え切れない情報導線を末尾に集約

## bobg_hpへの適用
- 2層ヘッダー: `.utility-row` + `.main-nav`
- 境界設計: `.panel` + `.section-head`（罫線）
- 色設計: `#17184B` を基軸に `--muted`, `--line` を補助色で構成
- 動き: `IntersectionObserver` による軽量リビール
- 内容保持: 本文は編集せず、source SVGをそのまま埋め込み

# Project AGENTS

このルールは、リポジトリルートの `AGENTS.md` を前提とした補足規則です。  
テンプレート化されたプロジェクトは、生成後に上位の仕様主導・品質ゲート運用を継承する前提で運用してください。

## このプロジェクト固有の運用
- `scripts/fast_check.sh` を短い反復で使う。
- マージ前に `scripts/check.sh` を必ず通す。
- 起動コマンドはこのファイルに追記して統一する。
- 1サイクルごとに `progress.md` を更新し、`Status / DoD / Checks` を反映する。
- 作業タスクは `current_tasks/` のロックを使って重複を避ける。
- 自律実行ログは `agent_logs/` に `agent-<name>-iter-<n>-<commit>.log` で残す。

## 例
- 開発起動: `npm run dev`
- マニフェスト生成: `npm run build:manifest`
- 整合性検証: `npm run test:integrity`
- E2Eスモーク: `npm run test:e2e`
- 高速検証: `scripts/fast_check.sh`
- 全体検証: `scripts/check.sh`

## 注意
- 不明点は `docs/decisions.md` に仮説・根拠・代替案を記録し、ユーザー確認待ちにせず前進する。
- 変更は小さく分割し、失敗時に巻き戻しやすくする。

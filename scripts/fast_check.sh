#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="${AUTO_LOG_DIR:-agent_logs}"
mkdir -p "$LOG_DIR"
RUN_LOG="$LOG_DIR/check_$(date -u +%Y%m%dT%H%M%SZ)_fast.log"

echo "[fast_check] start" | tee -a "$RUN_LOG"
node scripts/build_manifest.mjs >> "$RUN_LOG" 2>&1
node scripts/validate_site_content.mjs >> "$RUN_LOG" 2>&1
node scripts/check_integrity.mjs >> "$RUN_LOG" 2>&1
node scripts/test_e2e_smoke.mjs >> "$RUN_LOG" 2>&1
echo "[fast_check] PASS" | tee -a "$RUN_LOG"

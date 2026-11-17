# ADR-003 — Fresh start on a new branch, previous ERP archived

- Status: **Accepted and executed** (2026-11-15, approved by Ashish step by step)

## Context
The earlier ERP had units 3.0–3.16: hotel operations, booking, billing, a room board and an ops console, plus their docs and logs. Ashish judged it premature for current needs and asked to start the ERP again as a new Phase 1. He wanted to keep the public landing page exactly as it is and lose nothing.

The Blueprint (§18 Step 4) says "Preserve the current ERP … do not create a separate Sales frontend". The fresh start goes against that instruction, so it is recorded here as Ashish's decision.

## Decision
1. Archive everything at commit `825f3fe` on branch **`archive/hotel-draft`**, with annotated tag **`archive-hotel-draft-2026-11-15`**. Both were pushed to `origin` and checked with `git ls-remote` before anything was removed.
2. Work on `feature/phase1-fresh-start`, branched from `main`:
   - `a40defe` carried over Ashish's two uncommitted files;
   - `5d220ab` removed the 322 old ERP files (services, web, infra, scripts, old docs).
3. Kept: `landing-page/` (unchanged), `phase1_plan.md`, `ERP_DEV/{LICENSE,.editorconfig,.gitattributes,.gitignore}`, `AGENTS.md`, `.opencode/`, `opencode.json`, `.github/workflows/ci.yml` (rewritten for the new layout).
4. Ignored files stayed on disk and were **not** deleted: `ERP_DEV/.env`, `ERP_DEV/services/**/target`, `ERP_DEV/web/node_modules`, `ERP_DEV/logs`.
5. The work reaches `main` only through a reviewed merge or PR. No force-push, no history rewrite.
6. The five source extracts whose sha256 still matches the resource files were restored from the archive instead of being re-extracted.

## Consequences
- History is complete. Any old file can be recovered with `git show archive-hotel-draft-2026-11-15:<path>`.
- Old docs, logs and decisions don't apply to the new baseline. The new logs start fresh and point to the archive for anything earlier.
- Other branches (`develop`, `feature/*`, `ashish/backend_phase_1`) are left as they were. The project's git-workflow rule (`main` only from release/hotfix) is relaxed for this one merge, at Ashish's request. The new flow from here on is in phase1_plan.md §8.

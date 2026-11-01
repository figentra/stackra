# Plan: relock; core drops @figentra/cli (STA-1863)

1. Remove `@figentra/cli` from the root `devDependencies` and the catalog in `pnpm-workspace.yaml`.
2. Revert sta-1748's (469aed7b) switch in `.agents/hooks/session-context.mjs` and `tools/scripts/adr-reserve.mjs`
   back to `tools/scripts/ai-spend.mjs`, `tools/scripts/linear.mjs digest` and `./pr-merge.mjs`.
3. On testbed box 1 or 7: `pnpm install --lockfile-only`; bring back only `pnpm-lock.yaml`.
4. Install in the worktree from the new lockfile is not done on the Mac; commit with hooks on once they can run, and
   let CI prove `pnpm install --frozen-lockfile`.

# Plan: `showcase:coverage` (STA-2738)

The design and the tasks are in `spec.md` (`## Design`, `## Tasks`); this file is the build order.

1. `find-showcase-misses.function.ts` with `showcase-miss.type.ts` and `showcase-coverage-input.type.ts`, test first
   (`scripts/__tests__/find-showcase-misses.test.ts`, one case per acceptance criterion).
2. `coverage.ts`: registers the `#src` resolver hook as `gen.ts` does, loads the entries with `loadEntries` and
   `loadKitEntries`, reads the two `showcase.json` catalogues, the playground `src/routes` and `src/demos` folders, the
   playground per-slug `e2e/__tests__/<slug>.e2e.test.ts` files and the `@stackra/ui` `src/react/<slug>/__tests__` folders,
   calls the function, prints the count per gap and the skipped count, exits 1 on any miss.
3. Root `package.json` script `showcase:coverage`; one line in the showcase `AGENTS.md`.
4. Box 1 check: `nice -n 19`, the unit test with `--maxWorkers=2`, then the script itself; the miss count goes in the
   hand-over and on STA-2738. No miss is fixed here.

No changeset (the script is not in the published package). No workflow change.

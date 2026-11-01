# Implementation Plan: events testing records skipped listeners; repo-checks refuses gitignored goldens

**Spec**: `spec.md` · **Linear**: STA-1807 · **Branch**: `figentra/sta-1807-skipped-listeners-golden-check`

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session.

| Step | What                                                                             | Gate              |
| ---- | -------------------------------------------------------------------------------- | ----------------- |
| 1    | Plugin records skips per app; `app.listeners.skipped()`; test, README, changeset | events tests      |
| 2    | `checkIgnoredGoldens` pure core and node wrapper, registered; test, changeset    | repo-checks tests |

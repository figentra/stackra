# Implementation Plan: seed data under `assets/seeds` stays JSON

**Spec**: `spec.md` · **Linear**: STA-1825 · **Branch**: `figentra/sta-1825-seeds-json`

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session (stackra-8a).

| Step | What                                                  | Gate              |
| ---- | ----------------------------------------------------- | ----------------- |
| 1    | Add the seeds row to `MUST_STAY_JSON` with its reader | repo-checks tests |
| 2    | The json-configs test passes a seed file              | repo-checks tests |

# Implementation Plan: validate allows the committed openapi.json

**Spec**: `spec.md` · **Linear**: STA-1737 · **Branch**: `figentra/sta-1737-openapi-json-must-stay`

This Mac runs only oxfmt and oxlint; the repo-checks tests and validate run on a box through stackra-f4.

| Step | What                                                       | Gate              |
| ---- | ---------------------------------------------------------- | ----------------- |
| 1    | `MUST_STAY_JSON` row for `openapi.json`                    | `pnpm validate`   |
| 2    | Two paths in the `checkJsonConfigs` allow case of the test | repo-checks tests |

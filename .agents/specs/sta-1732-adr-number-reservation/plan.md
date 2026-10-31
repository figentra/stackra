# Implementation Plan: ADR number reservation

**Spec**: `spec.md` · **Linear**: STA-1732 · **Branch**: `figentra/sta-1732-adr-number-reservation`

This Mac runs only oxfmt and oxlint; tests and validate run on a box through stackra-f4, who lands the branch.

| Step | What                                                                                                 | Gate             |
| ---- | ---------------------------------------------------------------------------------------------------- | ---------------- |
| 1    | `numbers.yaml`, generated once from the ADR pages on main plus 0501 to 0506                          | validate via f4  |
| 2    | `checkAdrNumbers` in repo-checks, wired into `configFindings`, with its test                         | unit test via f4 |
| 3    | `tools/scripts/adr-reserve.mjs` and `pnpm adr:reserve`, pure parts tested with `node:test`           | `pnpm validate`  |
| 4    | AGENTS.md line; docs-adr skill, docs-adr-steward and the prompt hint say "reserve" not "highest + 1" | review           |

## Design notes

- **Race.** Two reservations of the same number both edit the end of `numbers.yaml` on main; the second PR conflicts
  once the first lands, so it closes and reserves again. No lock service.
- **No checkout.** The script uses the GitHub contents API (read main's file, create the branch from main's sha, put
  the file on it), so the caller's working tree and branch are untouched.
- **Keys.** Numbers are quoted four-digit keys; the check pads an unquoted key so `1` and `"0001"` are the same.

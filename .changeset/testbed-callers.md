---
"@stackra/cli": patch
"@stackra/flow-preset": patch
---

`stackra testbed` is deprecated in favour of `testbed` from `@figentra/testbed` (ADR 0522): it keeps working for
one release, then goes (ADR 0522 step 8). Install `@figentra/testbed` and call `testbed`; the verbs, flags, exit codes
and `--json` lines are the same.
The preset's ci-steward and flow-gate command name `testbed run`.

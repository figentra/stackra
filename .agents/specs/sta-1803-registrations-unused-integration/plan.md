# Implementation Plan: registrations import only the integrations they register

**Spec**: `spec.md` · **Linear**: STA-1803 · **Branch**: `figentra/sta-1803-registrations-unused-integration`

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session (stackra-8a).

| Step | What                                                                  | Gate          |
| ---- | --------------------------------------------------------------------- | ------------- |
| 1    | `registerConnections` checks both class names before importing either | gen tests     |
| 2    | A test with an integration that has no connection                     | gen tests     |
| 3    | Billing and pay re-run gen and typecheck                              | product gates |

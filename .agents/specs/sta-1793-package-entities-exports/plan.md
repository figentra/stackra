# Implementation Plan: packages with models export their entity list

**Spec**: `spec.md` · **Linear**: STA-1793 · **Branch**: `figentra/sta-1793-package-entities-exports`

This Mac runs only oxfmt and oxlint; validate, typecheck and tests run on a box through stackra-8a.

| Step | What                                                                                  | Gate                 |
| ---- | ------------------------------------------------------------------------------------- | -------------------- |
| 1    | 13 stand-in barrels export `<MEMBER>_ENTITIES`; their exact-export tests list it      | each package's tests |
| 2    | the check in `stackra validate --repository` (cli `package-entities/`), with its test | `pnpm validate`      |
| 3    | juristra's 8 services typecheck against this core                                     | stackra-8a           |

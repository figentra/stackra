# Implementation Plan: a member can name what library() returns

**Spec**: `spec.md` · **Linear**: STA-1743 · **Branch**: `figentra/sta-1743-tsdown-config-nameable-type`

This Mac runs only oxfmt and oxlint; typecheck and tests run on a box through stackra-f4.

| Step | What                                                                                        | Gate                            |
| ---- | ------------------------------------------------------------------------------------------- | ------------------------------- |
| 1    | `types/library-config.type.ts`, `library(): LibraryConfig`, exported from the entry         | tsdown-config typecheck         |
| 2    | `expectTypeOf(library()).toEqualTypeOf<LibraryConfig>()`                                    | tsdown-config tests             |
| 3    | An OS service's `export default library(...)` typechecks with only `@stackra/tsdown-config` | f4, on an OS service with 0.2.1 |

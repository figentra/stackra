# Implementation Plan: no require shim in a published dist

**Spec**: `spec.md` · **Linear**: STA-1722 · **Branch**: `figentra/sta-1722-ui-require-shim-2`

This Mac runs only oxfmt and oxlint; builds and tests run on a box through stackra-f4, who lands the branch.

| Step | What                                                                                     | Gate                                                          |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1    | 27dcb797 on main: react-dom optional peer of ui, the `__require` guard                   | tsdown-config tests                                           |
| 2    | `optionalRequires`: the guard rewrites a listed shim to a literal `require`; others fail | tsdown-config tests                                           |
| 3    | ui and identity pass their lazy optional peers                                           | ui and identity build; `native.mjs` keeps `require("expo-…")` |
| 4    | Mobile typecheck and the Pro devtools test against the built ui                          | f4                                                            |

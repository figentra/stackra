# Implementation Plan: the ui native entry loads without Skia

**Spec**: `spec.md` · **Linear**: STA-1791 · **Branch**: `figentra/sta-1791-ui-skia-optional-peer`

This Mac runs only oxfmt and oxlint; tests and builds run on a box through stackra-8a.

| Step | What                                                                                      | Gate               |
| ---- | ----------------------------------------------------------------------------------------- | ------------------ |
| 1    | `loadSkia()` with the inert stand-in, and its test                                        | ui tests           |
| 2    | the 22 files destructure their Skia values from `loadSkia()`; type imports stay           | ui typecheck, lint |
| 3    | `optionalRequires` gains the peer; the 13 Skia-mocking tests route `loadSkia` to the mock | ui build, ui tests |
| 4    | `dist/native.mjs` has `require  ("@shopify/react-native-skia")` and no static Skia import | stackra-8a         |

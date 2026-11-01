# Implementation Plan: port `~key` brands name the member key

**Spec**: `spec.md` · **Linear**: STA-1811 · **Branch**: `figentra/sta-1811-port-key-brands`

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session (stackra-8a).

| Step | What                                                              | Gate                      |
| ---- | ----------------------------------------------------------------- | ------------------------- |
| 1    | Six port brands and `PdfTableWriter`'s restated brand use the key | typecheck of the packages |
| 2    | The native-spotlight type test expects the snake_case key         | native-spotlight tests    |

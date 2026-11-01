# Implementation Plan: a settings section applies its defaults when nothing is stored

**Spec**: `spec.md` · **Linear**: STA-1826 · **Branch**: `figentra/sta-1826-settings-section-defaults`

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session (stackra-8a).

| Step | What                                                                       | Gate               |
| ---- | -------------------------------------------------------------------------- | ------------------ |
| 1    | `emit-schemas` emits a settings section field with `.prefault(() => ({}))` | gen unit test      |
| 2    | Reader test over a gen-shaped schema: no row, partial row, wrong type      | settings unit test |
| 3    | Patch changesets for `@stackra/gen` and `@stackra/settings`                | changeset status   |

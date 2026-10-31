# Implementation Plan: gen --check passes on a clean clone

**Spec**: `spec.md` · **Linear**: STA-1742 · **Branch**: `figentra/sta-1742-gen-check-clean-clone`

This Mac runs only oxfmt and oxlint; gen's tests and a clean-clone `gen --check` run on a box through stackra-f4.

| Step | What                                                                            | Gate           |
| ---- | ------------------------------------------------------------------------------- | -------------- |
| 1    | `write()` in check mode skips a missing file outside `COMMITTED`                | gen unit tests |
| 2    | Test: remove `.stackra/` and the root shim after gen; the check reports nothing | gen unit tests |
| 3    | `stackra gen --check` on a fresh clone of core main and of the template         | f4             |

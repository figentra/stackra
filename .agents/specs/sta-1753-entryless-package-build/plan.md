# Implementation Plan: an entryless package builds

**Spec**: `spec.md` · **Linear**: STA-1753 · **Branch**: `figentra/sta-1753-entryless-package-build`

This Mac runs only oxfmt and oxlint; gen's tests and a juristra build run on a box through stackra-f4.

| Step | What                                                                       | Gate                    |
| ---- | -------------------------------------------------------------------------- | ----------------------- |
| 1    | `emitPackageEntries` writes an empty `.` entry when no entry has an export | gen unit tests, goldens |
| 2    | juristra's pack-format, packs and `*-ui` build with this gen               | f4, against juristra    |

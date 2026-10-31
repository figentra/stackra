# Implementation Plan: gen reads the kind of an import-type base

**Spec**: `spec.md` · **Linear**: STA-1738 · **Branch**: `figentra/sta-1738-gen-import-type-kind`

This Mac runs only oxfmt and oxlint; the gen tests run on a box through stackra-f4, who lands the branch.

| Step | What                                                                                       | Gate           |
| ---- | ------------------------------------------------------------------------------------------ | -------------- |
| 1    | `TsNode.qualifier`; `readKind` takes `type.typeName ?? type.qualifier` for a `_base` const | gen typecheck  |
| 2    | Fixture test with a `.d.mts` package, `create-source-reader.function.test.ts`              | gen unit tests |

# Implementation Plan: gen output that consumers can typecheck

**Spec**: `spec.md` · **Linear**: STA-1749, STA-1750, STA-1751 · **Branch**: `figentra/sta-1749-gen-consumer-fixes`

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session (stackra-8a).

| Step | What                                                                                | Gate      |
| ---- | ----------------------------------------------------------------------------------- | --------- |
| 1    | `emitMemberModule` aliases a colliding dependency module class, with a test         | gen tests |
| 2    | `emitEntities` declares `[OptionalProps]` once per entity, compatible with its base | gen tests |
| 3    | `emitClients` emits only the schema constants the client reads, with a test         | gen tests |
| 4    | Consumers re-run gen and typecheck (pay, billing)                                   | box 7     |

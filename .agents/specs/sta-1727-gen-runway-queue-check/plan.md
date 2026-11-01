# Implementation Plan: gen checks that every derived queue has a runway entry

**Spec**: `spec.md` · **Linear**: STA-1727 · **Branch**: `figentra/sta-1727-gen-runway-queue-check`

This Mac runs only oxfmt and oxlint; tests run on a box through stackra-8a.

| Step | What                                                                           | Gate      |
| ---- | ------------------------------------------------------------------------------ | --------- |
| 1    | `yamlKeyTree` (node), with a test                                              | gen tests |
| 2    | `runwayQueues(root, manifest)` refusing `queue_unprovisioned`, with a test     | gen tests |
| 3    | `generate` runs it on a service's full run; README and AGENTS name the refusal | gen tests |

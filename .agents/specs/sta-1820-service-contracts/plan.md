# Implementation Plan: consumed services resolve from contract packages

**Spec**: `spec.md` · **Linear**: STA-1820 · **Branch**: `figentra/sta-1820-service-contracts`

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session.

| Step | What                                                                                      | Gate                 |
| ---- | ----------------------------------------------------------------------------------------- | -------------------- |
| 1    | `StackraKind.Contract`, schema, `stackra add` filter (FR-001)                             | skills and cli tests |
| 2    | `readServiceManifests` contract fallback, `readDependencyManifests` skip (FR-002, FR-003) | gen unit tests       |
| 3    | `serviceManifest` stops the member-name match (FR-004)                                    | gen unit tests       |
| 4    | events refusal `client_event_remote_transport`, no sibling-path import (FR-005)           | gen unit tests       |
| 5    | `readServiceCatalogues` from the contract, clients fix text (FR-006, FR-007)              | gen unit tests       |

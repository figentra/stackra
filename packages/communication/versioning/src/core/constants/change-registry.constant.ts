/**
 * Stackra file contract:
 * Purpose: `CHANGE_REGISTRY`, each subject class's changes, oldest `from` first, as `registerChanges` wrote them.
 * Boundary: internal: not exported from the entry; `registerChanges` writes it, and `downgrade`, `upgrade` and
 *           `resolveVersion` read it. A `Map`, not a `WeakMap`, because `resolveVersion` reads every dated change.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (2026-10-23 note).
 */
import type { RegisteredChange } from "#core/types/registered-change.type";

/** Subject class to its changes, sorted by `from`. */
export const CHANGE_REGISTRY = new Map<object, readonly RegisteredChange[]>();

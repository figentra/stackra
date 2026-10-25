/**
 * Stackra file contract:
 * Purpose: `ReplicaSlice`, the view `sliceArea` returns: the key-value calls of a storage area, limited to the rows of
 *          one value of a tenant dimension (one legal entity's replica rows).
 * Boundary: a type only: an area handle without the shape-class calls, since a slice holds replica rows, never a
 *           class's persisted state.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3: a replica scoped by a dimension).
 */
import type { StorageAreaHandle } from "#contracts/types/storage-area-handle.type";

/** One dimension value's view of an area. */
export type ReplicaSlice = Omit<StorageAreaHandle, "read" | "write">;

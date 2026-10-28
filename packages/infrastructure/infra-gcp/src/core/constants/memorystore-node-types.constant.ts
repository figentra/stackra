/**
 * Stackra file contract:
 * Purpose: `MEMORYSTORE_NODE_TYPES`, the Memorystore for Valkey node types a runway may name in `shared.cache.node`,
 *          smallest first; the first is the default when the runway names none.
 * Boundary: internal; read by the runway schema and `gcpRuntimeConfig`. The values keep Google's spelling (a tool-owned
 *           value), so they reach the instance unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1 and 5: the shared cache and its engine), ADR 0354.
 */

/** The Memorystore for Valkey node types, smallest first. */
export const MEMORYSTORE_NODE_TYPES = [
  "SHARED_CORE_NANO",
  "STANDARD_SMALL",
  "HIGHMEM_MEDIUM",
  "HIGHMEM_XLARGE",
] as const;

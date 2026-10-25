/**
 * Stackra file contract:
 * Purpose: `IndexMethod`, the Postgres index access methods a blueprint index may name with `.using(...)`.
 * Boundary: a type only; `btree` is the default when none is named.
 * Runtime: node
 * Governing contract: ADR 0159 (migrations); ADR 0221 (gin for the hybrid search columns).
 */

/** An index access method: `gin` for a tsvector or jsonb, `gist` for ranges and ltree. */
export type IndexMethod = "btree" | "gin" | "gist" | "brin" | "hash";

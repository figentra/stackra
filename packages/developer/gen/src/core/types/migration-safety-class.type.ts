/**
 * Stackra file contract:
 * Purpose: `MigrationSafetyClass`, the ADR 0159 class of one compiled migration statement, step or migration:
 *          `additive` (adds or relaxes, safe beside the running release), `online` (runs outside a transaction without
 *          blocking writes: a concurrent index build or drop, a constraint validation), `contract` (removes or narrows
 *          what the running release reads or writes: a dropped column, a rename, `SET NOT NULL`, a type change) and
 *          `banned` (never in a migration: data writes, a write-blocking index build on an existing table, a lock or a
 *          table rewrite).
 * Boundary: a type only. The classes are ordered `additive` < `online` < `contract` < `banned`; a step or migration
 *           takes the highest class of its statements, and `contract` and `banned` are destructive.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note: Additive, Online, Contract and Banned).
 */

/** The safety class of a migration statement, step or migration. */
export type MigrationSafetyClass = "additive" | "online" | "contract" | "banned";

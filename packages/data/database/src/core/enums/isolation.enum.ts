/**
 * Stackra file contract:
 * Purpose: `Isolation`, the isolation level a transaction a call starts runs at: `database.transaction(work, {
 *          isolation: Isolation.Serializable, retry: 3 })`.
 * Boundary: an `Enum.of` value plus the type of the same name; each code is the Postgres level's SQL name, which the
 *           drivers hand to the ORM as it is. Only the levels Postgres implements distinctly (`read uncommitted` runs as
 *           `read committed` there, so it is left out). The session default stays Postgres's `read committed`.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 2: one transaction per action); data-layer gap mo6 (P1 part, stackra-279).
 */
import { Enum } from "@stackra/contracts";

/** How much of other transactions' work a transaction sees. */
export const Isolation = Enum.of({
  /** Each statement sees what was committed before it began (the Postgres default). */
  ReadCommitted: "read committed",
  /** Every statement sees the snapshot the transaction's first statement took. */
  RepeatableRead: "repeatable read",
  /** As if the transactions ran one after another; a conflict fails one with `40001`, which `retry` runs again. */
  Serializable: "serializable",
});

/** One of the codes above. */
export type Isolation = Enum.Value<typeof Isolation>;

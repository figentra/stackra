/**
 * Stackra file contract:
 * Purpose: `PostgresFault`, the SQL of one database fault: the statements that install it, the ones that remove it,
 *          and the message a failed write carries.
 * Boundary: a public type of the `.` entry; `postgresFault` builds it and runs nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 4: fault injection; decision 3: Postgres in the integration tier).
 */

/** The statements that install and remove one database fault. */
export interface PostgresFault {
  /** Run in order, as a superuser or the table's owner, to arm the fault. */
  readonly install: readonly string[];
  /** Run in order to take it away; each is safe to run when it is already gone. */
  readonly remove: readonly string[];
  /** The message a failed write raises: `injected fault: <name>`. */
  readonly message: string;
}

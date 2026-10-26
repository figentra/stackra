/**
 * Stackra file contract:
 * Purpose: `AccessLoggedOptions`, what the `@AccessLogged(...)` class facet takes; read by the Explorer at bootstrap
 *          and by gen from the syntax tree.
 * Boundary: a type in the leaf entry. Every value is a literal, because gen reads decorator arguments statically: the
 *           subject is a field name, never a callback.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6, 8 and 15); ADR 0144 (Explorers); ADR 0134 (classification); ADR 0409
 *                     (`failClosed`).
 */
import type { DataClassification } from "@stackra/contracts";

/** The facet's options. */
export interface AccessLoggedOptions {
  /** The classification of the data the class exposes. */
  readonly classification: DataClassification;

  /**
   * A field of the records the class handles (`"customerId"`): each call is logged against that field of every record
   * among its arguments and its result. Omitted, each call is logged against the principal the call is for (the
   * actor, or the actor it acts on behalf of).
   */
  readonly subjects?: string;

  /**
   * `true` for a privileged surface (break-glass, support impersonation, a staff export): a call whose access record
   * cannot be written is refused, whatever the classification. Absent, the configured `failClosed` classes decide.
   */
  readonly failClosed?: boolean;
}

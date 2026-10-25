/**
 * Stackra file contract:
 * Purpose: `FactsContext`, the second parameter of a facts class's `provide`: who is asking, in which language, the
 *          record check of a query, and money formatted for the conversation.
 * Boundary: a type only; the MCP gateway in the ai service builds it per conversation for the agent's principal (the
 *           agent acting for its user). `authorize` is the query context's own, so facts and queries apply one policy;
 *           when it refuses, the gateway leaves the facts out.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 7: permission-aware facts); ADR 0098 (the agent principal); ADR 0136
 *                     (decision 1: the handler context).
 */
import type { QueryContext } from "@stackra/actions";

/** The context of one `provide` call. */
export interface FactsContext extends Pick<QueryContext, "actor" | "locale" | "authorize"> {
  /**
   * `minorUnits` of `currency` formatted in the context's locale (`SAR 1,250.00`, `١٬٢٥٠٫٠٠ ر.س.`).
   *
   * @param minorUnits - an integer amount in the currency's minor units, as the wire carries it (ADR 0220).
   * @param currency - an ISO 4217 code.
   */
  money(minorUnits: number, currency: string): string;
}

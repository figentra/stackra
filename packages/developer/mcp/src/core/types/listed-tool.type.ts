/**
 * Stackra file contract:
 * Purpose: `ListedTool`, one tool as `filterTools` lists it: the hosted tool plus `locked`, the marker of a tool the
 *          caller may use but the tenant's plan does not include.
 * Boundary: a type only. A locked tool is listed so the client can show it with an upgrade path; the gateway answers a
 *           call to it with "requires subscription" and never runs it.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decisions 3 and 4); STA-784 (a `locked` marker, not a separate list).
 */
import type { HostedTool } from "#core/types/hosted-tool.type";

/** A listed tool. */
export type ListedTool = HostedTool & {
  /** Whether the tenant's plan lacks the tool, so a call to it is answered "requires subscription". */
  readonly locked: boolean;
};

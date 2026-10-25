/**
 * Stackra file contract:
 * Purpose: `ConnectionLevel`, where a connection sits: with one user, or on a node of the scope tree. An
 *          Integration's `levels` lists the levels a lookup walks, in order.
 * Boundary: an `Enum.of` value plus the type of the same name. The scope tree's own levels (platform, product, tenant
 *           and any a deployment adds) are deployment data, so this package names none of them: a `Scope` connection
 *           sits on one node, a `ScopeRef`, and serves that node and every node below it (R-59, ADR 0327 decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 5 and 9); ADR 0327 (decisions 2, 3 and 5); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The levels a connection may sit at.
 *
 * @example
 * levels: [ConnectionLevel.User] // a per-user calendar never acts with an organisation's credentials
 * levels: [ConnectionLevel.Scope] // a mail provider for the scope the call acts in, or the nearest node above it
 */
export const ConnectionLevel = Enum.of({
  /** One credential set per user, never shared: the user the call acts for. */
  User: "user",
  /** One credential set on a scope node, found from the call's scope by walking up its path to the nearest one. */
  Scope: "scope",
});

/** One of the codes above. */
export type ConnectionLevel = Enum.Value<typeof ConnectionLevel>;

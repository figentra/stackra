/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/integrations, the leaf entry with the
 *          `ConnectionContext` port, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. The port
 *           is exported here only, never from `.` (ADR 0294 decision 15). `ConnectionStore` and `ConnectionHost` stay
 *           in `.`, because their signatures use the `Connection` base, `ConnectionRecord` and `OAuthTokens` of `.`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ConnectionContext } from "#contracts/ports/connection-context.port";

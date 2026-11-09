/**
 * Stackra file contract:
 * Purpose: `VERIFIED_EDGE_SCOPE`, the tenant a request's edge signature vouches for, recorded by `EdgeHeaderGuard` only
 *          after the signature and the request id both verify, and read by `serveGuardedCall` to give an anonymous call
 *          its tenant and to refuse a token whose tenant is another one.
 * Boundary: keyed by the very `Request` the guards checked, so nothing outside the guard can vouch for a scope and the
 *           entry goes with the request; a raw `x-figentra-tenant` header is never read in its place. Only a
 *           well-formed `scp_` id is recorded: the guard refuses a signed scope of any other form. No entry: no
 *           signed tenant (no edge headers, a platform host, or no edge guard bound).
 * Runtime: node
 * Governing contract: ADR 0437 (decisions 4 and 8: the Worker resolves the host's tenant and signs it).
 */
import type { PublicId } from "@stackra/contracts";

/** The signed tenant of each verified request. */
export const VERIFIED_EDGE_SCOPE = new WeakMap<Request, PublicId<"scp">>();

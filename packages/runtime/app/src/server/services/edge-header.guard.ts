/**
 * Stackra file contract:
 * Purpose: `EdgeHeaderGuard`, the first check of ADR 0437's server-check order: a `RequestGuard` that trusts
 *          the edge Worker's identity headers only with a valid HMAC under one of the active signing keys (two during
 *          a rotation), a timestamp inside the validity window and a request id not seen inside it. A request that
 *          carries any edge header (an identity header, the signature, the request id or the timestamp) must verify;
 *          one that carries none is not edge traffic (a service call, a cross-app delivery, a provider's webhook) and
 *          goes on to authentication or its endpoint's own signature check.
 * Boundary: stateless; the keys come from the bound `EdgeSigningKeys` and the seen ids from the bound `EdgeNonceStore`
 *           (both configuration: the driver is chosen by wiring). Every failure is one `EdgeSignatureInvalidError`.
 *           The nonce is claimed only after the signature verifies, so unsigned traffic cannot fill the store. Replays
 *           are refused per instance while the nonce store is the memory driver. The validity window is a getter a host
 *           overrides (ADR 0306). Rate limits, CSRF and the later checks of the order are other guards and the actions
 *           pipeline, not this one; a request with no edge header is authenticated there (ADR 0437 note of 2026-11-09).
 *           A verified request's signed tenant is recorded in `VERIFIED_EDGE_SCOPE`, keyed by the request.
 * Runtime: node
 * Governing contract: ADR 0437 (decisions 4 and 8; Enforcement); ADR 0457 (RequestGuard); ADR 0306 (overrides).
 */
import { createHash, timingSafeEqual } from "node:crypto";

import { Enum, isPublicId } from "@stackra/contracts";

import { EdgeHeader } from "#contracts/enums/edge-header.enum";
import type { EdgeNonceStore } from "#contracts/ports/edge-nonce-store.port";
import type { EdgeSigningKeys } from "#contracts/ports/edge-signing-keys.port";
import { signEdgeRequest } from "#core/functions/sign-edge-request.function";
import { RequestGuard } from "#server/bases/request-guard.base";
import { VERIFIED_EDGE_SCOPE } from "#server/constants/verified-edge-scope.constant";
import { EdgeSignatureInvalidError } from "#server/errors/edge-signature-invalid.error";

/**
 * Verifies the signed edge headers on every inbound request.
 *
 * @example
 * // a host override, src/overrides/app/edge-header.guard.ts
 * export class EdgeHeaderGuard extends BaseEdgeHeaderGuard {
 *   override get maxAge() { return 30; }
 * }
 */
export class EdgeHeaderGuard extends RequestGuard {
  /** The active signing secrets. */
  private readonly keys: EdgeSigningKeys;

  /** The request ids already accepted. */
  private readonly nonces: EdgeNonceStore;

  /**
   * @param keys - the bound signing-key provider.
   * @param nonces - the bound seen-request-id store.
   */
  constructor(keys: EdgeSigningKeys, nonces: EdgeNonceStore) {
    super();
    this.keys = keys;
    this.nonces = nonces;
  }

  /** First in ADR 0437's order: before origin, CSRF, rate limits and authentication. */
  override get order(): number {
    return -100;
  }

  /** How old a signature may be, in seconds, either side of now (ADR 0437: 60 by default). */
  get maxAge(): number {
    return 60;
  }

  /**
   * Lets `request` through when its edge signature holds.
   *
   * @throws EdgeSignatureInvalidError when a request carrying an edge header has no signature, or one that is wrong,
   *         stale or replayed, or when its signed scope is not a tenant's public id (`scp_…`).
   * @remarks A verified request's signed tenant is recorded in `VERIFIED_EDGE_SCOPE` for `serveGuardedCall`.
   */
  async check(request: Request): Promise<void> {
    const url = new URL(request.url);
    const header = (name: EdgeHeader) => request.headers.get(name);
    // no edge header at all: not edge traffic, so authentication (or the endpoint's own signature) decides
    if (Enum.values(EdgeHeader).every((name) => header(name) === null)) return;
    const signature = header(EdgeHeader.Signature);
    if (signature === null) throw EdgeSignatureInvalidError.create();
    const product = header(EdgeHeader.Product);
    const surface = header(EdgeHeader.Surface);
    const realm = header(EdgeHeader.Realm);
    const requestId = header(EdgeHeader.RequestId);
    const timestamp = Number(header(EdgeHeader.Timestamp) ?? Number.NaN);
    if (product === null || surface === null || realm === null || requestId === null)
      throw EdgeSignatureInvalidError.create();
    if (!Number.isInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > this.maxAge)
      throw EdgeSignatureInvalidError.create();
    const body = new Uint8Array(await request.clone().arrayBuffer());
    const input = {
      scope: header(EdgeHeader.Scope),
      product,
      surface,
      realm,
      requestId,
      timestamp,
      method: request.method,
      path: url.pathname + url.search,
      bodyHash: createHash("sha256").update(body).digest("hex"),
    };
    const given = Buffer.from(signature);
    let valid = false;
    for (const secret of await this.keys.active()) {
      const expected = Buffer.from(await signEdgeRequest(input, secret));
      // every key is tried, so the time taken does not say which one matched
      if (expected.length === given.length && timingSafeEqual(expected, given)) valid = true;
    }
    if (!valid) throw EdgeSignatureInvalidError.create();
    // twice the window: a timestamp may sit up to maxAge either side of now
    if (!(await this.nonces.claim(requestId, this.maxAge * 2)))
      throw EdgeSignatureInvalidError.create();
    // only now is the tenant the Worker resolved from the host trusted (ADR 0437); a signed scope that is not a
    // tenant's public id fails closed, never as a call with no tenant
    if (input.scope !== null) {
      if (!isPublicId(input.scope, "scp")) throw EdgeSignatureInvalidError.create();
      VERIFIED_EDGE_SCOPE.set(request, input.scope);
    }
  }
}

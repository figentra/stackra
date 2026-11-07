/**
 * Stackra file contract:
 * Purpose: the `InboxVerifier` port: decides whether a request to the consumer's inbox was signed by a producer it
 *          pins, from the headers and the raw body, before anything parses the body.
 * Boundary: an abstract class that is its own token, keyed `outbox.InboxVerifier`. The first driver is
 *           `ContractInboxVerifierDriver` (the pinned contracts' keys); STA-1792 replaces it, and nothing else moves. It
 *           never throws on a bad request: it answers a refusal reason. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 18, amendment of 2026-11-02).
 */
import { Port } from "@stackra/contracts";

import type { InboxVerification } from "#contracts/types/inbox-verification.type";

/**
 * Verifies the sender of an inbox request.
 *
 * @example
 * const verdict = await verifier.verify(headers, body);
 * if (!verdict.verified) return 401;
 */
export abstract class InboxVerifier extends Port {
  /** Type-only port key, so `DriverName<InboxVerifier>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.InboxVerifier";

  /** The verified sender of `body` under `headers` (lower-case names), or why it is refused. */
  abstract verify(
    headers: Readonly<Record<string, string | undefined>>,
    body: string | Uint8Array,
  ): Promise<InboxVerification>;
}

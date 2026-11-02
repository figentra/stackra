/**
 * Stackra file contract:
 * Purpose: the `InboxVerifier` port: how a consumer's inbox decides, before it reads a body, whether a request was
 *          signed by a producer this consumer pins, and which one.
 * Boundary: an abstract class that is its own token, keyed `outbox.InboxVerifier`. It reads the headers and the raw body
 *           only; it never parses the body. This is the seam STA-1792's workload identity replaces. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 11, 16 and 18, amendment of 2026-11-02); ADR 0294 (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { InboxVerdict } from "#contracts/types/inbox-verdict.type";

/**
 * Verifies the sender of an inbox request.
 *
 * @example
 * export class ContractInboxVerifierDriver extends Driver(InboxVerifier) {
 *   async verify(headers: Headers, body: string, now: Date): Promise<InboxVerdict> { ... }
 * }
 */
export abstract class InboxVerifier extends Port {
  /** Type-only port key, so `DriverName<InboxVerifier>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.InboxVerifier";

  /** Whether `body`, received with `headers` at `now`, was signed by a pinned producer, and which. */
  abstract verify(headers: Headers, body: string, now: Date): Promise<InboxVerdict>;
}

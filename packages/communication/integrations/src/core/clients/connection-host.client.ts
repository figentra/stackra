/**
 * Stackra file contract:
 * Purpose: `ConnectionHostClient`, this package's client of the integrations service: `call` sends one ref of the
 *          host's `ConnectionHostCalls` over the injected `ClientTransport`.
 * Boundary: internal to `.`; `ClientConnectionHostDriver` builds it. Its constructor takes the transport only (a class
 *           token, ADR 0294 rule 17); the refs are the driver's, passed per call. Input validation and the wire form are
 *           `ServiceClient`'s, and the transport decodes each answer with the ref's own output schema, so the records
 *           come back in their code form (dates as `Date`).
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3, 4 and 6).
 */
import { ServiceClient } from "@stackra/clients";

import type { ConnectionHostCalls } from "#core/types/connection-host-calls.type";

/** One ref of the host's calls. */
type HostRef = ConnectionHostCalls[keyof ConnectionHostCalls];

/**
 * The integrations service, as the `ConnectionHost` driver calls it.
 *
 * @example
 * const { items } = (await new ConnectionHostClient(transport).call(calls.resolve, { integrationKey })) as …;
 */
export class ConnectionHostClient extends ServiceClient {
  /**
   * Calls `ref` with `input` over the injected transport; the answer is still untyped.
   * @param ref - one of the host's `ConnectionHostCalls`.
   * @param input - the ref's input.
   */
  async call(ref: HostRef, input: unknown): Promise<unknown> {
    const member = ref.kind === "action" ? this.member(ref) : this.member(ref);
    return member.call(input as never);
  }
}

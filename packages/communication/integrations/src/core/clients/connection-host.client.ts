/**
 * Stackra file contract:
 * Purpose: `ConnectionHostClient`, this package's client of the integrations service: one `call` per ref of the host's
 *          `ConnectionHostCalls`, over the injected `ClientTransport`.
 * Boundary: internal to `.`; `ClientConnectionHostDriver` builds it. Input validation and the wire form are
 *           `ServiceClient`'s, and the transport decodes each answer with the ref's own output schema, so the records
 *           come back in their code form (dates as `Date`).
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3, 4 and 6).
 */
import { ServiceClient } from "@stackra/clients";
import type { ClientTransport } from "@stackra/clients/contracts";

import type { ConnectionHostCalls } from "#core/types/connection-host-calls.type";

/** One call of a ref, its output still untyped. */
type HostCall = (input: unknown) => Promise<unknown>;

/**
 * The integrations service, as the `ConnectionHost` driver calls it.
 *
 * @example
 * const { items } = (await new ConnectionHostClient(transport, calls).resolve({ integrationKey })) as …;
 */
export class ConnectionHostClient
  extends ServiceClient
  implements Record<keyof ConnectionHostCalls, HostCall>
{
  readonly resolve: HostCall;

  readonly load: HostCall;

  readonly store: HostCall;

  readonly disconnect: HostCall;

  readonly token: HostCall;

  /**
   * @param transport - the transport topology picked for calls to the integrations service.
   * @param calls - the service's generated refs.
   */
  constructor(transport: ClientTransport, calls: ConnectionHostCalls) {
    super(transport);
    const callOf = (ref: ConnectionHostCalls[keyof ConnectionHostCalls]): HostCall => {
      const member = ref.kind === "action" ? this.member(ref) : this.member(ref);
      return async (input) => member.call(input as never);
    };
    this.resolve = callOf(calls.resolve);
    this.load = callOf(calls.load);
    this.store = callOf(calls.store);
    this.disconnect = callOf(calls.disconnect);
    this.token = callOf(calls.token);
  }
}

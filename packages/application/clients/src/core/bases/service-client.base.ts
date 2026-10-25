/**
 * Stackra file contract:
 * Purpose: `ServiceClient`, the base of a service's generated client of another service (`class PaymentsClient extends
 *          ServiceClient`): `this.member(Ref)` turns a descriptor into a member with `call(input)` and, for an action,
 *          `queue(input)`, both going through the injected `ClientTransport`.
 * Boundary: a service class, so the client is its own DI token and a consumer receives it through its constructor; a
 *           test replaces it with `fakeClient()`. Topology picks the transport driver, so the consumer's code is the
 *           same in process and over the network. The input is validated before the transport runs.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3, 4, 6 and 10); ADR 0145 (classes are tokens); ADR 0263 (gen writes the
 *                     wiring).
 */
import { Service } from "@stackra/container";

import type { ClientTransport } from "#contracts/ports/client-transport.port";
import { clientRequest } from "#core/functions/client-request.function";
import type { ActionMember } from "#core/types/action-member.type";
import type { ActionRef } from "#core/types/action-ref.type";
import type { CallOptions } from "#core/types/call-options.type";
import type { CallRef } from "#core/types/call-ref.type";
import type { QueryMember } from "#core/types/query-member.type";
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";

/**
 * A generated client of another service.
 *
 * @example
 * export class PricingClient extends ServiceClient {
 *   readonly price = { quote: this.member(QuotePriceQuery) };
 * }
 *
 * const quote = await this.pricing.price.quote.call({ market, lines });
 */
export abstract class ServiceClient extends Service {
  private readonly transport: ClientTransport;

  /** @param transport - the driver the topology picked: in process, RPC or HTTP. */
  constructor(transport: ClientTransport) {
    super();
    this.transport = transport;
  }

  /** The member that calls and queues the action `ref`. */
  protected member<A extends ActionRef>(ref: A): ActionMember<A>;

  /** The member that calls the query `ref`. */
  protected member<Q extends QueryRef>(ref: Q): QueryMember<Q>;

  /** Builds either member over the transport. */
  protected member(ref: CallRef): ActionMember<ActionRef> | QueryMember<QueryRef> {
    const transport = this.transport;
    // Async, so an invalid input rejects like every other failure. The transport decodes with the ref's output schema.
    const call = async (input: RefInput<CallRef>, options?: CallOptions) =>
      transport.send(clientRequest(ref, input, options)) as Promise<RefOutput<CallRef>>;
    if (ref.kind === "query") return Object.freeze({ call });
    return Object.freeze({
      call,
      queue: async (input: RefInput<ActionRef>, options?: CallOptions) =>
        transport.queue(clientRequest(ref, input, options)),
    });
  }
}

/**
 * Stackra file contract:
 * Purpose: `ActionRunnerClient`, the service client the action runner sends through: any consumed action, by its ref, over
 *          the container's `ClientTransport`.
 * Boundary: internal to the `./react` entry; input validation and the wire form are `ServiceClient`'s. shortcut: a call
 *           is sent, never queued offline, because `@stackra/clients` keeps its offline-aware run internal; use it once
 *           that package exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3 and 4).
 */
import { ServiceClient } from "@stackra/clients";
import type { ActionRef, RefInput, RefOutput } from "@stackra/clients";

/** Sends one action of any ref. */
export class ActionRunnerClient extends ServiceClient {
  /**
   * Sends `action` with `input`.
   *
   * @throws InputInvalidError when `input` does not match the action's input schema.
   * @throws ClientError the producer's refusal, or the transport's error.
   */
  send<A extends ActionRef>(action: A, input: RefInput<A>): Promise<RefOutput<A>> {
    return this.member(action).call(input) as Promise<RefOutput<A>>;
  }
}

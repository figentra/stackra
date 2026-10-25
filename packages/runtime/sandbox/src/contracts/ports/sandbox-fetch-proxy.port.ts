/**
 * Stackra file contract:
 * Purpose: the `SandboxFetchProxy` port: the audited egress a code step's `fetch` goes through, the only network a
 *          sandboxed run has. The host that runs the worker pool implements it (it records every request against the
 *          run's reference and sends it from the platform's egress).
 * Boundary: an abstract class that is its own token, keyed `sandbox.SandboxFetchProxy`. `Sandbox` checks the run's
 *           allow-list before calling it, so a request reaching it is already allowed; the proxy may refuse more. A
 *           rejection reaches the code as a rejected `fetch`. A leaf file: it imports nothing outside `src/contracts`
 *           but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0154 (decision 5: network only through an allow-listed, audited fetch proxy); ADR 0142
 *                     (drivers behind ports); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { SandboxFetchRequest } from "#contracts/types/sandbox-fetch-request.type";
import type { SandboxFetchResponse } from "#contracts/types/sandbox-fetch-response.type";

/**
 * The audited egress of the sandbox.
 *
 * @example
 * export class EgressSandboxFetchProxyDriver extends Driver(SandboxFetchProxy) {
 *   async fetch(request: SandboxFetchRequest, reference: string, signal: AbortSignal): Promise<SandboxFetchResponse> { ... }
 * }
 */
export abstract class SandboxFetchProxy extends Port {
  /** Type-only port key, so `DriverName<SandboxFetchProxy>` narrows to this port's drivers. */
  declare readonly "~key": "sandbox.SandboxFetchProxy";

  /**
   * Sends `request` for the run named `reference`, and gives back its response.
   *
   * @param reference - the caller's id of the run (a workflow step key), so the audit names it.
   * @param signal - aborted when the run ends first, by its result or a limit.
   */
  abstract fetch(
    request: SandboxFetchRequest,
    reference: string,
    signal: AbortSignal,
  ): Promise<SandboxFetchResponse>;
}

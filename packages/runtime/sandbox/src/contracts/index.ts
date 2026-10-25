/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/sandbox (the `SandboxFetchProxy` port and the request
 *          and response types it uses) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { SandboxFetchProxy } from "#contracts/ports/sandbox-fetch-proxy.port";
export type { SandboxFetchRequest } from "#contracts/types/sandbox-fetch-request.type";
export type { SandboxFetchResponse } from "#contracts/types/sandbox-fetch-response.type";

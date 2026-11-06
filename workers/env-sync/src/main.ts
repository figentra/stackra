/**
 * Stackra file contract:
 * Purpose: entry of @figentra/worker-env-sync, the `stackra-env-sync` Worker: hands every request to
 *          `handleEnvSyncRequest` with the bindings wrangler.jsonc and runway.yaml declare.
 * Boundary: wiring only; the signature check, the routing and the dispatch live in src/webhook.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6).
 */
import type { EnvSyncEnv } from "#src/interfaces";
import { handleEnvSyncRequest } from "#src/webhook";

/** The Worker's module handlers: hands each request to the webhook. */
export default {
  fetch: (request: Request, env: EnvSyncEnv): Promise<Response> =>
    handleEnvSyncRequest(request, env),
};

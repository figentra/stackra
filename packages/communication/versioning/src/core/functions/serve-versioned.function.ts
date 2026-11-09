/**
 * Stackra file contract:
 * Purpose: `serveVersioned`, the one runtime path of a versioned call, which the generated adapter wraps around the
 *          action pipeline: it picks the call's dated version, runs the call, shapes its output for that version
 *          (`downgrade`) and answers with `Stackra-Version`, `Deprecation`, `Sunset` and `Vary` set. The version is the
 *          `Stackra-Version` header if sent and still served; else a key caller's pin (a key caller is an `api_client`
 *          actor or a call carrying a verified key credential; one with no pin is refused with `VersionRequiredError`);
 *          else the latest served date, for every other caller, never the oldest.
 * Boundary: reads the `Stackra-Version` header, the `VersioningConfig`, the optional `VersionSupportSource` (the support
 *           months; `VERSION_SUPPORT_MONTHS` when none is bound) and the optional `Clock` from the container, and
 *           answers a `Response`. The call itself always runs on the latest shape; only its top-level output is
 *           downgraded, and a refusal never is (one error shape across versions). A version refusal and a refusal of the
 *           call are answered here as their envelope with the kind's status, and still carry the version headers (a
 *           version refusal carries `Vary` only, since no version was chosen). With fewer than two served dates the API
 *           is dormant: the one date is echoed, if there is one, and no call is refused over its version. A
 *           `RateLimitedError` and any non-refusal error propagate for the adapter's own answer. A `Response` the call
 *           returns itself passes through with the headers added.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decisions 1 to 4); ADR 0140 (envelope); ADR 0237; STA-2532 (FR-006 to FR-008,
 *                     FR-016).
 */
import { ActorKind, Clock, Enum, VersionSupportSource } from "@stackra/contracts";
import {
  ErrorKind,
  IdempotencyKeyInProgressError,
  isRefusal,
  RateLimitedError,
} from "@stackra/errors";

import { VersioningConfig } from "#config/versioning.config";
import { VERSIONING_HEADERS } from "#core/constants/versioning-headers.constant";
import { applyVersionHeaders } from "#core/functions/apply-version-headers.function";
import { downgrade } from "#core/functions/downgrade.function";
import { resolveVersion } from "#core/functions/resolve-version.function";
import { varyOnVersion } from "#core/functions/vary-on-version.function";
import type { VersionedCall } from "#core/types/versioned-call.type";

/** A refusal as its envelope, with the kind's HTTP status; any other error (and a rate limit) is rethrown. */
function refused(error: unknown): Response {
  if (!isRefusal(error) || isRefusal(error, RateLimitedError)) throw error;
  return Response.json(error.toEnvelope(), {
    status: Enum.meta(ErrorKind, error.kind).httpStatus,
    // the first call with this key is still running: ask the client to retry shortly
    ...(isRefusal(error, IdempotencyKeyInProgressError) ? { headers: { "Retry-After": "1" } } : {}),
  });
}

/**
 * Answers one call in its dated version.
 *
 * @param request - the inbound request, whose `Stackra-Version` header names the version.
 * @param call - the container, the verified caller and the output schema class.
 * @param run - runs the call on the latest shape, given the version the call resolved to (for the pipeline's
 *              `CallOptions.apiVersion`, so the audit entry names it), and returns its output (or a `Response`).
 * @throws RateLimitedError or a non-refusal error `run` threw, for the adapter's answer.
 * @example
 * return serveVersioned(request, { container, actor, credential: key?.credential, subject: OrderView }, () =>
 *   new ActionPipeline(container).execute(GetOrderQuery, input, { actor }),
 * );
 */
export async function serveVersioned(
  request: Request,
  call: VersionedCall,
  run: (apiVersion: string | undefined) => Promise<unknown>,
): Promise<Response> {
  const { container } = call;
  const served = container.has(VersioningConfig) ? container.get(VersioningConfig).supported : [];
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy built here; toSorted is ES2023 and the base lib is ES2022
  const supported = [...served].sort();
  let resolved: ReturnType<typeof resolveVersion> | undefined;
  if (supported.length === 1) resolved = { version: supported[0] as string, headers: {} };
  else if (supported.length > 1) {
    try {
      resolved = resolveVersion({
        header: request.headers.get(VERSIONING_HEADERS.version),
        pin: call.credential?.versionPin,
        required: call.credential !== undefined || call.actor.kind === ActorKind.ApiClient,
        supported,
        fallback: supported.at(-1) as string,
        supportMonths: container.has(VersionSupportSource)
          ? await container.get(VersionSupportSource).supportMonths()
          : undefined,
        now: container.has(Clock) ? container.get(Clock).now() : new Date(),
      });
    } catch (error) {
      const response = refused(error);
      varyOnVersion(response.headers);
      return response;
    }
  }

  let response: Response;
  try {
    const output = await run(resolved?.version);
    if (output instanceof Response) response = new Response(output.body, output);
    else {
      const shaped =
        resolved !== undefined &&
        call.subject !== undefined &&
        typeof output === "object" &&
        output !== null
          ? downgrade(call.subject, output, resolved.version)
          : output;
      response = Response.json(shaped ?? null);
    }
  } catch (error) {
    response = refused(error);
  }
  if (resolved !== undefined) applyVersionHeaders(response.headers, resolved);
  return response;
}

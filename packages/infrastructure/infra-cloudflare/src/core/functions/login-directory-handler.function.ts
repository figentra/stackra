/**
 * Stackra file contract:
 * Purpose: `loginDirectoryHandler(options)`, the fetch handler of the login directory Worker: a sign-in page posts the
 *          identifier a person typed (`{ "kind": "email", "value": "…" }`), the handler hashes it through `prefixOf`,
 *          lists the KV keys under that prefix and answers the regions that hold an account (`{ "regions": ["eu"] }`,
 *          in the configured order; empty when none), so the page sends the person to their region's login host or
 *          shows a region picker.
 * Boundary: routes only; authenticates no one and stores nothing. The identifier is read from the body (never a URL)
 *           and never logged or echoed; answers are `no-store`. 405 for any method but POST, 400 for a body that is
 *           not a small JSON identifier or does not normalise. Rate limits and bot checks are the route's, at the
 *           zone edge (ADR 0437 decision 2.7). A separate Worker from the OS edge Worker, on its own route.
 * Runtime: isomorphic (Workers runtime)
 * Governing contract: ADR 0451; ADR 0353 (decision 4); OS ADR 0002 (decision 1); ADR 0437 (one Worker per concern on
 *                     its own route).
 */
import { z } from "zod";

import type { LoginDirectoryOptions } from "#core/types/login-directory-options.type";

/** The request body: a kind and a value of sign-in identifier sizes. */
const BODY = z.strictObject({ kind: z.string().min(1).max(16), value: z.string().min(1).max(320) });

/** The largest body read, in characters. */
const MAX_BODY = 1024;

/** A JSON answer that no cache keeps. */
const answer = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/**
 * The directory Worker's handler over `options`.
 *
 * @example
 * export default {
 *   fetch: (request, env) =>
 *     loginDirectoryHandler({
 *       kv: env.DIRECTORY,
 *       regions: env.REGIONS.split(","),
 *       prefixOf: (id) => loginDirectoryPrefix(id, { id: env.KEY_ID, secret: env.DIRECTORY_KEY }),
 *     })(request),
 * };
 */
export function loginDirectoryHandler(
  options: LoginDirectoryOptions,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method !== "POST")
      return new Response(null, { status: 405, headers: { allow: "POST" } });
    const text = await request.text();
    let parsed: unknown;
    try {
      parsed = text.length <= MAX_BODY ? JSON.parse(text) : undefined;
    } catch {
      parsed = undefined;
    }
    const body = BODY.safeParse(parsed);
    const prefix = body.success ? await options.prefixOf(body.data) : undefined;
    if (prefix === undefined) return answer(400, { error: "invalid_identifier" });

    const { keys } = await options.kv.list({ prefix });
    const found = new Set(keys.map((key) => key.name.slice(prefix.length)));
    return answer(200, { regions: options.regions.filter((region) => found.has(region)) });
  };
}

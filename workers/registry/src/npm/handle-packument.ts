/**
 * Stackra file contract:
 * Purpose: `handlePackument`: `GET /@scope/name`.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { gate } from "#src/access/gate";
import { failure } from "#src/http/failure";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import { metadataCache } from "#src/npm/metadata-cache";
import { packumentBody } from "#src/npm/packument-body";

/** npm's media type for the abbreviated packument. */
const ABBREVIATED = "application/vnd.npm.install-v1+json";

/** `GET /@scope/name`. */
export async function handlePackument(
  deps: RegistryDeps,
  request: Request,
  name: string,
): Promise<Response> {
  const passed = await gate(deps, request, name);
  if (passed instanceof Response) return passed;
  const abbreviated = (request.headers.get("accept") ?? "").includes(ABBREVIATED);
  const body = await packumentBody(deps, name, abbreviated);
  if (body === null) return failure(404, "not_found");
  return new Response(body, {
    headers: {
      "content-type": abbreviated ? ABBREVIATED : "application/json",
      "cache-control": metadataCache(deps, passed.scope),
      vary: "accept, authorization",
    },
  });
}

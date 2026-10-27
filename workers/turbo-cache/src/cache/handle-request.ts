/**
 * Stackra file contract:
 * Purpose: `handleTurboCacheRequest(request, env)`, Turborepo's remote-cache API (v8) over R2:
 *          `GET /v8/artifacts/status` (`{ status: "enabled" }`), `POST /v8/artifacts/events` (accepted, dropped),
 *          `PUT|GET|HEAD /v8/artifacts/:hash` (upload, download, exists) and `POST /v8/artifacts` (`{ hashes }` in,
 *          size, task duration and tag per hash out). The team (`teamId`, else `slug` query) namespaces every key as
 *          `<prefix><team>/<hash>`.
 * Boundary: every request needs `Authorization: Bearer <TURBO_CACHE_TOKEN>`, checked in constant time; a missing
 *           token or setting fails closed with 503 before anything is read. An artifact older than the TTL setting is
 *           a miss; the bucket's lifecycle rule deletes it later. Uploads over the size setting get 413 and need a
 *           Content-Length (411). Artifacts are opaque: turbo signs them (`remoteCache.signature`) and checks the tag
 *           itself, the Worker only stores and returns `x-artifact-tag`. No body or token is ever logged.
 * Runtime: worker
 * Governing contract: ADR 0026 (decisions 1 to 3); ADR 0289 (decision 2); the Turborepo remote-cache API (v8).
 */
import { ARTIFACT_HASH_PATTERN, TEAM_PATTERN } from "#src/constants";
import type { TurboCacheEnv, TurboCacheObject, TurboCacheSettings } from "#src/interfaces";

import { readSettings } from "./read-settings";
import { tokensMatch } from "./tokens-match";

/** `/v8/artifacts`, optionally followed by one segment (a hash, `status` or `events`) and a trailing slash. */
const ROUTE = /^\/v8\/artifacts(?:\/([^/]+))?\/?$/;

/** A JSON answer. */
const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** An error answer in the API's `{ error: { code, message } }` shape. */
const fail = (status: number, code: string, message: string): Response =>
  json(status, { error: { code, message } });

/** 405 naming the allowed methods. */
const notAllowed = (allow: string): Response =>
  new Response(null, { status: 405, headers: { allow } });

/** Whether `object` is younger than the TTL. */
const fresh = (object: TurboCacheObject, settings: TurboCacheSettings): boolean =>
  Date.now() - object.uploaded.getTime() <= settings.ttlSeconds * 1000;

/** The headers describing a stored artifact. */
const artifactHeaders = (object: TurboCacheObject): Headers => {
  const headers = new Headers({
    "content-type": "application/octet-stream",
    "content-length": String(object.size),
  });
  const tag = object.customMetadata?.["tag"];
  if (tag !== undefined) headers.set("x-artifact-tag", tag);
  return headers;
};

/**
 * Answers one request to the cache Worker.
 *
 * @example
 * export default { fetch: (request: Request, env: TurboCacheEnv) => handleTurboCacheRequest(request, env) };
 */
export async function handleTurboCacheRequest(
  request: Request,
  env: TurboCacheEnv,
): Promise<Response> {
  const settings = readSettings(env);
  if (settings === undefined)
    return fail(503, "cache_misconfigured", "The cache token or a setting is not configured");

  const url = new URL(request.url);
  const route = ROUTE.exec(url.pathname);
  if (route === null) return fail(404, "not_found", "Not found");

  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!(await tokensMatch(bearer, settings.token)))
    return fail(401, "unauthorized", "A valid bearer token is required");

  const segment = route[1];
  if (segment === "status")
    return request.method === "GET" ? json(200, { status: "enabled" }) : notAllowed("GET");
  // Usage events (hits and misses) are not recorded.
  if (segment === "events")
    return request.method === "POST" ? new Response(null, { status: 200 }) : notAllowed("POST");

  const team = url.searchParams.get("teamId") ?? url.searchParams.get("slug");
  if (team === null || !TEAM_PATTERN.test(team))
    return fail(
      400,
      "bad_request",
      "A teamId or slug query of letters, digits, _ or - is required",
    );
  const keyOf = (hash: string): string => `${settings.keyPrefix}${team}/${hash}`;

  if (segment === undefined)
    return request.method === "POST" ? query(request, env, settings, keyOf) : notAllowed("POST");
  if (!ARTIFACT_HASH_PATTERN.test(segment))
    return fail(400, "bad_request", "The artifact hash must be letters and digits");
  const key = keyOf(segment);

  switch (request.method) {
    case "HEAD": {
      const object = await env.BUCKET.head(key);
      return object !== null && fresh(object, settings)
        ? new Response(null, { status: 200, headers: artifactHeaders(object) })
        : new Response(null, { status: 404 });
    }
    case "GET": {
      const object = await env.BUCKET.get(key);
      return object !== null && fresh(object, settings)
        ? new Response(object.body, { status: 200, headers: artifactHeaders(object) })
        : fail(404, "not_found", "Artifact not found");
    }
    case "PUT":
      return upload(request, env, settings, key, `${team}/${segment}`);
    default:
      return notAllowed("GET, HEAD, PUT");
  }
}

/** `PUT /v8/artifacts/:hash`: stores the body with its tag and duration, within the size setting. */
async function upload(
  request: Request,
  env: TurboCacheEnv,
  settings: TurboCacheSettings,
  key: string,
  url: string,
): Promise<Response> {
  const length = request.headers.get("content-length");
  if (length === null || !/^\d+$/.test(length))
    return fail(411, "length_required", "Content-Length is required");
  if (Number(length) > settings.maxArtifactBytes)
    return fail(413, "too_large", `The artifact is over ${settings.maxArtifactBytes} bytes`);
  if (request.body === null) return fail(400, "bad_request", "The artifact body is empty");

  const customMetadata: Record<string, string> = {};
  const tag = request.headers.get("x-artifact-tag");
  if (tag !== null) customMetadata["tag"] = tag;
  const duration = request.headers.get("x-artifact-duration");
  if (duration !== null && /^\d+$/.test(duration)) customMetadata["duration"] = duration;

  await env.BUCKET.put(key, request.body, { customMetadata });
  return json(202, { urls: [url] });
}

/** `POST /v8/artifacts`: size, task duration and tag of each asked hash; a miss answers an error entry. */
async function query(
  request: Request,
  env: TurboCacheEnv,
  settings: TurboCacheSettings,
  keyOf: (hash: string) => string,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  const hashes = (body as { hashes?: unknown } | undefined)?.hashes;
  if (
    !Array.isArray(hashes) ||
    hashes.length > settings.maxQueryHashes ||
    !hashes.every((hash) => typeof hash === "string" && ARTIFACT_HASH_PATTERN.test(hash))
  )
    return fail(
      400,
      "bad_request",
      `The body must be { hashes } with at most ${settings.maxQueryHashes} letter-and-digit hashes`,
    );

  const entries = await Promise.all(
    (hashes as string[]).map(async (hash) => {
      const object = await env.BUCKET.head(keyOf(hash));
      if (object === null || !fresh(object, settings))
        return [hash, { error: { message: "Artifact not found" } }] as const;
      const tag = object.customMetadata?.["tag"];
      return [
        hash,
        {
          size: object.size,
          taskDurationMs: Number(object.customMetadata?.["duration"] ?? 0),
          ...(tag === undefined ? {} : { tag }),
        },
      ] as const;
    }),
  );
  return json(200, Object.fromEntries(entries));
}

/**
 * Stackra file contract:
 * Purpose: `handleEnvSyncRequest(request, env, fetcher)`, Infisical's webhook: `POST /infisical` with a signed JSON
 *          body naming the changed project, environment and path dispatches the env-sync workflow
 *          (`.github/workflows/env-sync.yml` on `main`) of the repository `ENV_SYNC_ROUTES` maps the project to, with
 *          the Runway environment and the path as inputs. `GET /readyz` answers 200 when every setting is there and
 *          503 naming the unset or unreadable ones (names only), for the deploy's smoke check.
 * Boundary: fails closed: a missing webhook secret or a bad, missing or stale signature answers 401 before the body is
 *           parsed; a payload holding a value key (`value`, `secretValue`, `secrets`) answers 400, since the webhook
 *           carries metadata only. An event other than `secrets.modified` answers 200 and dispatches nothing. An
 *           unknown project answers 404, an unknown environment slug 400, a missing App id or key
 *           (`installationToken`) or invalid routes 503, and a GitHub refusal 502. No header, token or body is ever
 *           logged.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6); GitHub's workflow dispatch REST API.
 */
import { GITHUB_HEADERS, REPOSITORY_PATTERN, RUNWAY_ENVIRONMENTS } from "#src/constants";
import type { EnvSyncEnv } from "#src/interfaces";

import { carriesValue } from "./carries-value";
import { installationToken } from "./installation-token";
import { missingSettings } from "./missing-settings";
import { signatureValid } from "./signature-valid";

/** The webhook route. */
const PATH = "/infisical";

/** The readiness route the deploy's smoke check reads: 200 when every setting is there, 503 naming the missing ones. */
const READY_PATH = "/readyz";

/** The one Infisical event that dispatches a sync. */
const EVENT = "secrets.modified";

/** The workflow file every routed repository carries. */
const WORKFLOW = "env-sync.yml";

/** A JSON answer. */
const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** An error answer in the `{ error: { code, message } }` shape. */
const fail = (status: number, code: string, message: string): Response =>
  json(status, { error: { code, message } });

/** The global fetch, called unbound-safe. */
const globalFetch: typeof fetch = (input, init) => fetch(input, init);

/** A non-empty string, or `undefined`. */
const text = (value: unknown): string | undefined =>
  typeof value === "string" && value !== "" ? value : undefined;

/** The routes setting as a project-to-repository map, or `undefined` when it is not a JSON object of repositories. */
function readRoutes(raw: string | undefined): ReadonlyMap<string, string> | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? "");
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return undefined;
  const entries = Object.entries(parsed);
  return entries.every(([, repo]) => typeof repo === "string" && REPOSITORY_PATTERN.test(repo))
    ? new Map(entries as [string, string][])
    : undefined;
}

/**
 * Answers one request to the env-sync Worker.
 *
 * @param fetcher - the fetch the GitHub dispatch goes through (a stand-in in tests).
 * @example
 * export default { fetch: (request: Request, env: EnvSyncEnv) => handleEnvSyncRequest(request, env) };
 */
export async function handleEnvSyncRequest(
  request: Request,
  env: EnvSyncEnv,
  fetcher: typeof fetch = globalFetch,
): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (pathname === READY_PATH) {
    if (request.method !== "GET")
      return new Response(null, { status: 405, headers: { allow: "GET" } });
    const missing = missingSettings(env);
    if (readRoutes(env.ENV_SYNC_ROUTES) === undefined) missing.push("ENV_SYNC_ROUTES");
    return missing.length === 0
      ? json(200, { ready: true })
      : fail(503, "not_ready", `Unset or unreadable: ${missing.join(", ")}`);
  }
  if (pathname !== PATH) return fail(404, "not_found", "Not found");
  if (request.method !== "POST")
    return new Response(null, { status: 405, headers: { allow: "POST" } });

  const body = await request.text();
  const secret = env.INFISICAL_WEBHOOK_SECRET;
  if (
    secret === undefined ||
    secret === "" ||
    !(await signatureValid(request.headers.get("x-infisical-signature"), body, secret, Date.now()))
  )
    return fail(401, "unauthorized", "A valid, recent x-infisical-signature is required");

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return fail(400, "bad_request", "The body must be JSON");
  }
  if (carriesValue(payload))
    return fail(400, "value_refused", "The webhook carries metadata only, never a value");
  // Only a change of values syncs; Infisical's other events (rotation failed, requests) are acknowledged and dropped.
  const event = text((payload as { event?: unknown } | null)?.event);
  if (event !== EVENT) return json(200, { ignored: event ?? null });
  const project = (payload as { project?: Record<string, unknown> } | null)?.project;
  const projectId = text(project?.["workspaceId"]);
  const slug = text(project?.["environment"]);
  const path = text(project?.["secretPath"]);
  if (projectId === undefined || slug === undefined || path === undefined)
    return fail(
      400,
      "bad_request",
      "The body must carry project.workspaceId, environment and secretPath",
    );

  const routes = readRoutes(env.ENV_SYNC_ROUTES);
  if (routes === undefined)
    return fail(503, "sync_misconfigured", "ENV_SYNC_ROUTES is not a JSON object of owner/repo");
  const repository = routes.get(projectId);
  if (repository === undefined)
    return fail(404, "unknown_project", "No repository for this project");
  const environment = RUNWAY_ENVIRONMENTS.get(slug);
  if (environment === undefined)
    return fail(400, "unknown_environment", "The environment must be dev, staging or prod");
  const got = await installationToken(repository, env, fetcher, Math.floor(Date.now() / 1000));
  if (!("token" in got)) return fail(got.status, got.code, got.message);

  const answer = await fetcher(
    `https://api.github.com/repos/${repository}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        ...GITHUB_HEADERS,
        authorization: `Bearer ${got.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ ref: "main", inputs: { environment, path } }),
    },
  );
  return answer.status === 204
    ? json(202, { dispatched: { repository, environment, path } })
    : fail(502, "dispatch_failed", `GitHub answered ${answer.status}`);
}

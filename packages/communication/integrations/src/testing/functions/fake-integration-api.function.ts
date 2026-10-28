/**
 * Stackra file contract:
 * Purpose: `fakeIntegrationApi`, a fake of an Integration's managed client that answers the routes a test declares,
 *          for `makeConnection`, `.withIntegrationApi` and a driver under test.
 * Boundary: no request leaves the process and no secret is read: an answer is called with the path's parameters and
 *           the request, and what it returns (or throws) is the call's result. A call no route answers rejects with a
 *           `TypeError` that names it, so a test never passes on an unplanned call.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0308 (rule 13).
 */
import type { Integration, IntegrationApi, IntegrationClass, RequestOptions } from "#core/index";
import type { FakeAnswer } from "#testing/types/fake-answer.type";
import type { FakeIntegrationRoutes } from "#testing/types/fake-integration-routes.type";

/** One declared route. */
interface Route {
  readonly method: string;
  readonly segments: readonly string[];
  readonly answer: FakeAnswer<string>;
}

/** The path's segments, without empty ones. */
const segmentsOf = (path: string): string[] => path.split("/").filter((segment) => segment !== "");

/** The parameters of `path` when it matches `route`, or undefined. */
function match(route: Route, method: string, path: string): Record<string, string> | undefined {
  const segments = segmentsOf(path);
  if (route.method !== method || route.segments.length !== segments.length) return undefined;
  const params: Record<string, string> = {};
  for (const [index, expected] of route.segments.entries()) {
    const actual = segments[index] ?? "";
    if (expected.startsWith(":")) params[expected.slice(1)] = decodeURIComponent(actual);
    else if (expected !== actual) return undefined;
  }
  return params;
}

/**
 * A fake managed client of `type`.
 *
 * @param configure - declares the routes on the builder it is given.
 * @example
 * const api = fakeIntegrationApi(ResendIntegration, (fake) =>
 *   fake.get("/emails/receiving/:id").returns(({ id }) => ({ id, from: "customer@acme.example" })),
 * );
 */
export function fakeIntegrationApi<I extends Integration>(
  type: IntegrationClass<I>,
  configure: (routes: FakeIntegrationRoutes) => unknown,
): IntegrationApi {
  const routes: Route[] = [];
  const route =
    (method: string) =>
    (path: string): { returns: (answer: FakeAnswer<string>) => FakeIntegrationRoutes } => ({
      returns(answer) {
        routes.unshift({ method, segments: segmentsOf(path), answer });
        return builder;
      },
    });
  const builder = {
    get: route("GET"),
    delete: route("DELETE"),
    post: route("POST"),
    put: route("PUT"),
    patch: route("PATCH"),
  } as unknown as FakeIntegrationRoutes;
  configure(builder);

  /** Answers one call from the first route that matches it. */
  async function call(
    method: string,
    path: string,
    body: unknown,
    request: RequestOptions = {},
  ): Promise<unknown> {
    for (const known of routes) {
      const params = match(known, method, path);
      if (params !== undefined)
        return known.answer(params, {
          body,
          query: request.query ?? {},
          headers: request.headers ?? {},
        });
    }
    throw new TypeError(`The fake of ${type.name} has no answer for ${method} ${path}`);
  }

  return {
    get: <T>(path: string, request?: RequestOptions) =>
      call("GET", path, undefined, request) as Promise<T>,
    delete: <T>(path: string, request?: RequestOptions) =>
      call("DELETE", path, undefined, request) as Promise<T>,
    post: <T>(path: string, body?: unknown, request?: RequestOptions) =>
      call("POST", path, body, request) as Promise<T>,
    put: <T>(path: string, body?: unknown, request?: RequestOptions) =>
      call("PUT", path, body, request) as Promise<T>,
    patch: <T>(path: string, body?: unknown, request?: RequestOptions) =>
      call("PATCH", path, body, request) as Promise<T>,
  };
}

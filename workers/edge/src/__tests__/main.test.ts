/**
 * Stackra file contract:
 * Purpose: unit tests of the Worker entry: it reaches the origin through the runtime's `fetch` for both of its callers,
 *          the forward of a mapped host's request and the frame-ancestor lookup of a `"request"` path, whose answer
 *          ends in the response's `frame-ancestors`; every answer names its version (`x-stackra-version`). The global
 *          `fetch` here refuses a wrong `this` as the Workers runtime does ("Illegal invocation"), which Node's `fetch`
 *          does not.
 * Boundary: test only; the entry over a dev-shaped environment, a stubbed global `fetch`, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decisions 2, 4 and 5).
 */
import { FRAME_ANCESTORS_PATH } from "#src/http/frame-ancestors-path";
import type { EdgeEnv } from "#src/interfaces/edge-env.interface";
import worker from "#src/main";

const HOST_SCOPE = "scp_01j9z3k4m5n6p7q8r9s0t1v2wa";

/** A Worker environment: a console host with a scope, and a checkout host whose `/c/*` framers the origin names. */
const env = {
  EDGE_SIGNING_SECRET: "edge-secret",
  EDGE_ORIGIN: "https://origin.example",
  EDGE_HOST_MAP: JSON.stringify({
    "app.acme.example": {
      product: "commerce",
      surface: "console",
      realm: "staff",
      scope: HOST_SCOPE,
    },
    "checkout.pay.example": { product: "pay", surface: "checkout", realm: "public", scope: null },
  }),
  EDGE_OIDC_ISSUER: "https://auth.acme.example",
  EDGE_OIDC_AUDIENCE: "project-1",
  EDGE_OIDC_KEYS_SECONDS: 3600,
  EDGE_TOKEN_LEEWAY_SECONDS: 60,
  EDGE_CSP: JSON.stringify({ "pay.checkout": { frameAncestors: { "/c/*": "request" } } }),
  EDGE_FRAME_ANCESTORS_SECONDS: 60,
  CF_VERSION_METADATA: { id: "dc8dcd28-271b-4367-9840-6c244f84cb40" },
} as unknown as EdgeEnv;

/** What reached the origin. */
const reached: Request[] = [];

/** A `fetch` that answers as the origin would, and refuses a `this` that is neither absent nor the global scope. */
function runtimeFetch(
  this: unknown,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (this !== undefined && this !== globalThis)
    throw new TypeError("Illegal invocation: function called with incorrect `this` reference.");
  const request = new Request(input, init);
  reached.push(request);
  return Promise.resolve(
    new URL(request.url).pathname === FRAME_ANCESTORS_PATH
      ? Response.json({ origins: ["https://shop.example"] })
      : new Response("page"),
  );
}

describe("the Worker entry", () => {
  beforeEach(() => {
    reached.length = 0;
    vi.stubGlobal("fetch", runtimeFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards a mapped host's request to the origin, signed", async () => {
    const response = await worker.fetch(new Request("https://app.acme.example/api/x"), env);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("page");
    expect(response.headers.get("x-stackra-version")).toBe("dc8dcd28-271b-4367-9840-6c244f84cb40");
    expect(reached.map((request) => request.url)).toEqual(["https://origin.example/api/x"]);
  });

  it("asks the origin who may frame a request path, and answers with it", async () => {
    const response = await worker.fetch(new Request("https://checkout.pay.example/c/cs_01"), env);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors https://shop.example",
    );
    expect(reached.map((request) => new URL(request.url).pathname).toSorted()).toEqual(
      [FRAME_ANCESTORS_PATH, "/c/cs_01"].toSorted(),
    );
  });
});

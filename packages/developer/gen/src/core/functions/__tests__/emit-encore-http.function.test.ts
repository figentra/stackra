/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreHttp`: a service that declares @stackra/app gets `stackra-encore/<member>/http.ts`,
 *          whose `answerHttp` runs through `app.handlers.run`, answers `OPTIONS` with 204 and `corsHeaders` over the
 *          bound `CorsConfig`, and adds those headers to every other answer (`Vary` appended) with `apiCacheControl`'s
 *          `private, no-store` (ADR 0325 rule 22); a service that declares @stackra/errors answers a `RateLimitedError`
 *          with 429 and `rateLimitHeaders` (STA-1477), one without it keeps the plain answer; the request body is
 *          `nodeBodyStream(req)`, never `Readable.toWeb` (STA-2794); a call `run` turns away (overloaded or draining)
 *          is answered by `app.handlers.shed` (STA-1467); a service without
 *          @stackra/app, a package and an app get none.
 * Boundary: test only; asserts on the generated source text of the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437; ADR 0295 (decision 8); ADR 0325 (rule 22); STA-1385;
 *                     STA-1448; STA-2794; STA-1467.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEncoreHttp } from "#core/functions/emit-encore-http.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The entry import of a generated stackra-encore/<service>/ file; a constant so validate does not read it as this test's own import. */
const GENERATED_ENTRY = "../../.stackra/entry/server";

describe(emitEncoreHttp, () => {
  it("writes the CORS adapter of a service that runs @stackra/app", () => {
    const file = emitEncoreHttp(BILLING_IR);
    expect(file?.path).toBe("stackra-encore/billing/http.ts");
    const content = file?.content ?? "";
    for (const line of [
      "  corsHeaders,",
      `import { app } from "${GENERATED_ENTRY}";`,
      "  return app.handlers.run(async (container) => {",
      "    const cors = corsHeaders(request, container.get(CorsConfig));",
      '    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });',
      '      if (name === "vary") response.headers.append(name, value);',
      "    const cacheControl = apiCacheControl(request, response);",
      '    if (cacheControl !== undefined) response.headers.set("cache-control", cacheControl);',
    ])
      expect(content).toContain(line);
  });

  it("bridges a raw request through serveGuardedCall: capped body, guards, CallAuthenticator, the signed visitor, written back (STA-2577)", () => {
    const content = emitEncoreHttp(BILLING_IR)?.content ?? "";
    for (const line of [
      "export async function answerCall(req: IncomingMessage, resp: ServerResponse, call: Call): Promise<void> {",
      "  nodeBodyStream,",
      '    ...(method === "GET" || method === "HEAD" ? {} : { body: nodeBodyStream(req), duplex: "half" }),',
      "      maxBodyBytes: container.get(HttpConfig).maxBodyBytes,",
      "      guard: (guarded) => app.handlers.guard(guarded, container),",
      "      authenticate: (credentials) => new CallAuthenticator(container).authenticate(credentials),",
      "      visitor: (guarded) => new VisitorIdentityService(container.get(VisitorConfig)).resolve(guarded),",
      "  action?: AnyClass;",
      "      action: call.action,",
      "  if (response.body === null) resp.end();",
      "  else Readable.fromWeb(response.body as never).pipe(resp);",
    ])
      expect(content).toContain(line);
    // Readable.toWeb crashes on Encore's RawRequest at the end of every body (STA-2794).
    expect(content).not.toContain("body: Readable.toWeb(req)");
  });

  it("answers a rate-limited refusal with 429 and its back-off headers when @stackra/errors is declared", () => {
    const content = emitEncoreHttp(BILLING_IR)?.content ?? "";
    for (const line of [
      'import { isRefusal, RateLimitedError, rateLimitHeaders } from "@stackra/errors";',
      "      if (!isRefusal(error, RateLimitedError)) throw error;",
      "      answered = Response.json(error.toEnvelope(), { status: 429, headers: rateLimitHeaders(error) });",
    ])
      expect(content).toContain(line);
    const bare = emitEncoreHttp({
      ...BILLING_IR,
      packages: (BILLING_IR.packages ?? []).filter((name) => name !== "@stackra/errors"),
    })?.content;
    expect(bare).not.toContain("@stackra/errors");
    expect(bare).toContain("    const answered = await handle(request, container);");
  });

  it("answers a call the app sheds or turns away while draining through app.handlers.shed (STA-1467)", () => {
    const content = emitEncoreHttp(BILLING_IR)?.content ?? "";
    expect(content).toContain(
      "  }, { signal: request.signal }).catch((error: unknown) => app.handlers.shed(request, error));",
    );
  });

  it("passes the request's abort signal, aborted when the client goes away, to the bulkhead (STA-1467)", () => {
    const content = emitEncoreHttp(BILLING_IR)?.content ?? "";
    for (const line of [
      "  const gone = new AbortController();",
      '  resp.once("close", () => {',
      '    if (!resp.writableFinished) gone.abort(new Error("the client closed the connection"));',
      "    signal: gone.signal,",
      "  }, { signal: request.signal }).catch((error: unknown) => app.handlers.shed(request, error));",
    ])
      expect(content).toContain(line);
  });

  it("bounds the body read by HttpConfig.bodyReadTimeoutMs, so a slow upload never holds a shed place (STA-1467)", () => {
    const content = emitEncoreHttp(BILLING_IR)?.content ?? "";
    expect(content).toContain(
      "      bodyReadTimeoutMs: container.get(HttpConfig).bodyReadTimeoutMs,",
    );
  });

  it("writes none without @stackra/app or outside a service", () => {
    expect(emitEncoreHttp(COMMERCE_IR)).toBeUndefined();
    expect(emitEncoreHttp({ ...BILLING_IR, layout: "package" })).toBeUndefined();
    expect(emitEncoreHttp({ ...BILLING_IR, layout: "app" })).toBeUndefined();
  });
});

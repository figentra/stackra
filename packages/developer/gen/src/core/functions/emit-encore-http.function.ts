/**
 * Stackra file contract:
 * Purpose: `emitEncoreHttp`, a service's HTTP adapter (`.stackra/encore/<member>/http.ts`): `answerHttp(request,
 *          handle)`, which every generated raw endpoint answers through. It answers an `OPTIONS` preflight with 204
 *          and `corsHeaders(request, CorsConfig)`, and adds the same CORS headers to every other answer, with
 *          `Cache-Control: private, no-store` where `apiCacheControl` forces it (ADR 0325 rule 22), inside
 *          `app.handlers.run` so a drain waits for it.
 * Boundary: pure; written only for a service that declares `@stackra/app` (the wiring then binds `CorsConfig` as
 *           `app.cors`). The adapter never decides an origin itself: `corsHeaders` echoes only an allowed one and
 *           `OriginGuard` refuses the request. `Vary: Origin` is appended to what the handler set, never replacing it.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (server-check order); ADR 0325 (rule 22: the gateway marks signed-in answers); ADR 0295 (decision 8: the adapters reach the member through
 *                     `handlers`); ADR 0091 and 0124 (Encore is generated); STA-1374 (stackra-216); STA-1385.
 */
import { ENCORE_APP_IMPORT } from "#core/constants/encore-app-import.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The HTTP adapter of a service, or undefined when it does not run `@stackra/app`.
 *
 * @example
 * emitEncoreHttp(ir)?.path; // ".stackra/encore/billing/http.ts"
 */
export function emitEncoreHttp(ir: MemberIR): GeneratedFile | undefined {
  if (ir.layout !== "service") return undefined;
  const app =
    (ir.packages ?? []).includes("@stackra/app") ||
    ir.dependencies.some((dependency) => dependency.package === "@stackra/app");
  if (!app) return undefined;
  const header = generatedHeader({
    from: "the service layout and its @stackra/app dependency",
    purpose:
      `the HTTP adapter of ${ir.package}: CORS preflights answered with 204, CORS headers on every answer, ` +
      "signed-in answers private, no-store.",
    boundary:
      "every raw endpoint answers through `answerHttp`; the headers come from `corsHeaders` over the bound " +
      "`CorsConfig` (`app.cors`) and `apiCacheControl`, never from this file.",
    runtime: "node",
  });
  return {
    path: `.stackra/encore/${ir.member}/http.ts`,
    content: [
      header,
      'import { apiCacheControl, CorsConfig, corsHeaders } from "@stackra/app/server";',
      'import type { Container } from "@stackra/container";',
      "",
      ENCORE_APP_IMPORT,
      "",
      "/**",
      " * Answers one request: an `OPTIONS` preflight with 204 and the CORS headers, any other with `handle`'s answer and",
      " * the CORS headers; `private, no-store` when the request is signed in or the answer sets a cookie (ADR 0325 r22).",
      " */",
      "export function answerHttp(",
      "  request: Request,",
      "  handle: (request: Request, container: Container) => Promise<Response>,",
      "): Promise<Response> {",
      "  return app.handlers.run(async (container) => {",
      "    const cors = corsHeaders(request, container.get(CorsConfig));",
      '    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });',
      "    const answered = await handle(request, container);",
      "    // A fetched answer's headers are immutable: copy it once.",
      "    const response = new Response(answered.body, answered);",
      "    for (const [name, value] of cors)",
      '      if (name === "vary") response.headers.append(name, value);',
      "      else response.headers.set(name, value);",
      "    const cacheControl = apiCacheControl(request, response);",
      '    if (cacheControl !== undefined) response.headers.set("cache-control", cacheControl);',
      "    return response;",
      "  });",
      "}",
      "",
    ].join("\n"),
  };
}

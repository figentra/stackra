/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreHttp`: a service that declares @stackra/app gets `.stackra/encore/<member>/http.ts`,
 *          whose `answerHttp` runs through `app.handlers.run`, answers `OPTIONS` with 204 and `corsHeaders` over the
 *          bound `CorsConfig`, and adds those headers to every other answer (`Vary` appended) with `apiCacheControl`'s
 *          `private, no-store` (ADR 0325 rule 22); a service without @stackra/app, a package and an app get none.
 * Boundary: test only; asserts on the generated source text of the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437; ADR 0295 (decision 8); ADR 0325 (rule 22); STA-1385;
 *                     STA-1448.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEncoreHttp } from "#core/functions/emit-encore-http.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The entry import of a generated .stackra/encore/<service>/ file; a constant so validate does not read it as this test's own import. */
const GENERATED_ENTRY = "../../entry/server";

describe(emitEncoreHttp, () => {
  it("writes the CORS adapter of a service that runs @stackra/app", () => {
    const file = emitEncoreHttp(BILLING_IR);
    expect(file?.path).toBe(".stackra/encore/billing/http.ts");
    const content = file?.content ?? "";
    for (const line of [
      'import { apiCacheControl, CorsConfig, corsHeaders } from "@stackra/app/server";',
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

  it("writes none without @stackra/app or outside a service", () => {
    expect(emitEncoreHttp(COMMERCE_IR)).toBeUndefined();
    expect(emitEncoreHttp({ ...BILLING_IR, layout: "package" })).toBeUndefined();
    expect(emitEncoreHttp({ ...BILLING_IR, layout: "app" })).toBeUndefined();
  });
});

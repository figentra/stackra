/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreAuth`: a service with endpoints gets `.stackra/encore/<member>/auth.ts`, one
 *          `authHandler` over the `Authorization` and `Stackra-On-Behalf-Of` headers that runs `CallAuthenticator`
 *          inside the app's handlers and answers `APIError.unauthenticated` for its refusal only, and the one
 *          `Gateway` over it; a service with no endpoint, a package and an app get none.
 * Boundary: test only; asserts on the generated source text of the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0209 (decision 3 and its 2026-11-07 amendment); STA-2558.
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { emitEncoreAuth } from "#core/functions/emit-encore-auth.function";

describe(emitEncoreAuth, () => {
  it("writes the auth handler and gateway of a service with endpoints", () => {
    const file = emitEncoreAuth(COMMERCE_IR, true);
    expect(file?.path).toBe(".stackra/encore/commerce/auth.ts");
    const content = file?.content ?? "";
    expect(content).toContain('authorization: Header<"Authorization">;');
    expect(content).toContain('onBehalfOf?: Header<"Stackra-On-Behalf-Of">;');
    expect(content).toContain("authHandler<AuthParams, CallAuthData>((params) =>");
    expect(content).toContain(
      ".run((container) => new CallAuthenticator(container).authenticate(params))",
    );
    expect(content).toContain("if (isRefusal(error, BearerTokenInvalidError))");
    expect(content).toContain('throw APIError.unauthenticated("unauthenticated");');
    expect(content).toContain("export const gateway = new Gateway({ authHandler: auth });");
    expect(content).toContain('import { app } from "../../entry/server";');
  });

  it("writes none for a service with no endpoint, a package or an app", () => {
    expect(emitEncoreAuth(COMMERCE_IR, false)).toBeUndefined();
    expect(emitEncoreAuth({ ...COMMERCE_IR, layout: "package" }, true)).toBeUndefined();
    expect(emitEncoreAuth({ ...COMMERCE_IR, layout: "app" }, true)).toBeUndefined();
  });
});

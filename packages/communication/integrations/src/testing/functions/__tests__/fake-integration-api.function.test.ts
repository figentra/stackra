/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeIntegrationApi`: a route answers with its path parameters and the request, a raw body
 *          reaches the route as its text with its media type, a later route for the same call wins, an answer that
 *          throws rejects the call, and a call no route answers is refused by name.
 * Boundary: test only; no request leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import { HttpMethod } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import {
  AuthType,
  ConnectionLevel,
  Integration,
  IntegrationCategory,
  ProviderUnavailableError,
} from "#core/index";
import { fakeIntegrationApi } from "#testing/functions/fake-integration-api.function";

class ResendIntegration extends Integration({
  provider: "resend",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  baseUrl: "https://api.resend.com",
}) {}

describe("fakeIntegrationApi", () => {
  it("answers with the path parameters and the request", async () => {
    const api = fakeIntegrationApi(ResendIntegration, (fake) =>
      fake
        .get("/emails/receiving/:id")
        .returns(({ id }) => {
          expectTypeOf(id).toEqualTypeOf<string>();
          return { id, text: "CANCEL ord_1" };
        })
        .post("/emails")
        .returns((_params, request) => ({ echoed: request.body, key: request.query["dryRun"] })),
    );
    await expect(api.get("/emails/receiving/em_1")).resolves.toEqual({
      id: "em_1",
      text: "CANCEL ord_1",
    });
    await expect(
      api.post("/emails", { to: "a@acme.example" }, { query: { dryRun: true } }),
    ).resolves.toEqual({
      echoed: { to: "a@acme.example" },
      key: true,
    });
  });

  it("hands a raw body to the route as its text, with its media type", async () => {
    const api = fakeIntegrationApi(ResendIntegration, (fake) =>
      fake.post("/soap").returns((_params, request) => ({
        body: request.body,
        type: request.headers["content-type"],
      })),
    );
    await expect(
      api.post("/soap", undefined, { body: { content: "<a/>", contentType: "text/xml" } }),
    ).resolves.toEqual({ body: "<a/>", type: "text/xml" });
  });

  it("lets a later route win and an answer reject", async () => {
    const api = fakeIntegrationApi(ResendIntegration, (fake) =>
      fake
        .get("/domains")
        .returns(() => ({ data: [] }))
        .get("/domains")
        .returns(() => {
          throw ProviderUnavailableError.create({ provider: "resend" });
        }),
    );
    await expect(api.get("/domains")).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it("answers send with a route's status, or a 200 of its answer as text", async () => {
    const api = fakeIntegrationApi(ResendIntegration, (fake) =>
      fake
        .post("/invoices")
        .returns((_, request) => ({ status: 409, body: String(request.body) }))
        .get("/status")
        .returns(() => ({ ok: true })),
    );

    await expect(
      api.send({
        method: HttpMethod.Post,
        path: "/invoices",
        body: { content: "<a/>", contentType: "text/xml" },
      }),
    ).resolves.toEqual({ status: 409, headers: {}, body: "<a/>" });
    await expect(api.send({ method: HttpMethod.Get, path: "/status" })).resolves.toEqual({
      status: 200,
      headers: {},
      body: '{"ok":true}',
    });
  });

  it("refuses a call no route answers", async () => {
    const api = fakeIntegrationApi(ResendIntegration, () => undefined);
    await expect(api.delete("/domains/d_1")).rejects.toThrow(
      "The fake of ResendIntegration has no answer for DELETE /domains/d_1",
    );
  });
});

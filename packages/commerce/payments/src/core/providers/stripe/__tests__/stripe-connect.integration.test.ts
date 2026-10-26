/**
 * Stackra file contract:
 * Purpose: unit tests of `StripeConnectIntegration`: the authorize URL asks for read_write with the caller's client id,
 *          state and redirect; completing posts the code as an authorization-code grant and returns only the account
 *          id; revoking posts the client id and the account; the Integration is platform-only, form-bodied and signs
 *          webhooks like Stripe.
 * Boundary: test only; the platform client is `fakeIntegrationApi`, handed over through a stand-in runtime.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; R4-6.
 */
import { kindOf } from "@stackra/container";
import { IntegrationRuntime } from "@stackra/integrations";
import type { FakeIntegrationRoutes } from "@stackra/integrations/testing";
import { fakeIntegrationApi } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { StripeConnectIntegration } from "#core/providers/stripe/stripe-connect.integration";
import { STRIPE_WEBHOOKS } from "#core/providers/stripe/stripe-webhooks.constant";

/** The Integration over routes the test writes. */
function connectWith(routes: (r: FakeIntegrationRoutes) => unknown): StripeConnectIntegration {
  const api = fakeIntegrationApi(StripeConnectIntegration, routes);
  const runtime = Object.assign(Object.create(IntegrationRuntime.prototype) as IntegrationRuntime, {
    client: () => api,
  });
  return new StripeConnectIntegration(runtime);
}

describe("StripeConnectIntegration", () => {
  it("builds the authorize URL from the caller's values", () => {
    const url = new URL(
      connectWith(() => undefined).authorizeUrl({
        clientId: "ca_test",
        state: "st_1",
        redirectUri: "https://console.example/stripe/return",
      }),
    );
    expect(url.origin + url.pathname).toBe("https://connect.stripe.com/oauth/authorize");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      response_type: "code",
      client_id: "ca_test",
      scope: "read_write",
      state: "st_1",
      redirect_uri: "https://console.example/stripe/return",
    });
  });

  it("completes with the account id only, and revokes it", async () => {
    const sent: unknown[] = [];
    const connect = connectWith((r) =>
      r
        .post("/oauth/token")
        .returns((_p, { body }) => {
          sent.push(body);
          return { stripe_user_id: "acct_9", livemode: false, access_token: "sk_legacy" };
        })
        .post("/oauth/deauthorize")
        .returns((_p, { body }) => {
          sent.push(body);
          return { stripe_user_id: "acct_9" };
        }),
    );
    expect(await connect.complete("ac_code")).toEqual({ accountRef: "acct_9", livemode: false });
    await connect.revoke("ca_test", "acct_9");
    expect(sent).toEqual([
      { grant_type: "authorization_code", code: "ac_code" },
      { client_id: "ca_test", stripe_user_id: "acct_9" },
    ]);
  });

  it("is platform-only, form-bodied and verified like Stripe", () => {
    expect(kindOf(StripeConnectIntegration)?.options).toMatchObject({
      provider: "stripe-connect",
      levels: [],
      requestBody: "form",
      webhooks: STRIPE_WEBHOOKS,
    });
  });
});

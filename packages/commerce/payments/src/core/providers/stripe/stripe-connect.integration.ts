/**
 * Stackra file contract:
 * Purpose: `StripeConnectIntegration`, Stripe Connect's OAuth host (connect.stripe.com) as the platform's own
 *          Integration: the OAuth Standard onboarding of a merchant's own Stripe account (`oauth-standard` mode) and
 *          its revocation, plus the platform's Connect webhook (`account.application.deauthorized` when the merchant
 *          revokes from their dashboard), signed like every Stripe webhook.
 * Boundary: platform-only (no connection level); it calls with the platform's secret key, read blind from the secret
 *           store. It returns the connected account's id and never keeps the legacy access token Stripe also issues:
 *           the merchant's `StripeConnection` acts with the platform key and the `Stripe-Account` header. The OAuth
 *           client id (`ca_…`) is a public value the caller passes from its configuration. Which Markets offer
 *           `oauth-standard` is market-pack data.
 * Runtime: isomorphic
 * Governing contract: R4-6; RV-43; US-43; ADR 0308 (rules 1, 3, 4, 15 and 20); Stripe Connect OAuth.
 */
import { Secret } from "@stackra/config";
import { AuthType, Integration, IntegrationCategory } from "@stackra/integrations";

import { STRIPE_WEBHOOKS } from "#core/providers/stripe/stripe-webhooks.constant";

/** The authorize page, on this Integration's host. */
const AUTHORIZE_URL = "https://connect.stripe.com/oauth/authorize";

/** What the token endpoint answers, the fields the platform reads. */
interface StripeOAuthGrant {
  readonly stripe_user_id: string;
  readonly livemode?: boolean;
  readonly scope?: string;
}

/**
 * Stripe Connect OAuth Standard, for the platform.
 *
 * @example
 * const url = connect.authorizeUrl({ clientId, state, redirectUri });
 * const { accountRef } = await connect.complete(code);
 * await store.connect(StripeConnection, { fields: { secretKey, mode: "oauth-standard", accountRef } });
 */
export class StripeConnectIntegration extends Integration({
  provider: "stripe-connect",
  category: IntegrationCategory.Payments,
  levels: [],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {secretKey}" },
  baseUrl: "https://connect.stripe.com",
  requestBody: "form",
  webhooks: STRIPE_WEBHOOKS,
  health: { every: "6h", failAfter: 3 },
}) {
  /** The platform's secret key, which Stripe takes as the OAuth client secret. */
  @Secret("STRIPE_PLATFORM_SECRET_KEY")
  secretKey!: string;

  /** The platform's Connect webhook endpoint secret. */
  @Secret("STRIPE_CONNECT_WEBHOOK_SECRET")
  webhookSecret!: string;

  /**
   * The page the merchant is sent to, to connect their own Stripe account to the platform.
   *
   * @param input.clientId - the platform's Connect client id (`ca_…`), a public value.
   * @param input.state - the caller's anti-forgery value, echoed back to `redirectUri`.
   * @param input.redirectUri - one of the redirect URIs set on the platform's Connect settings.
   */
  authorizeUrl(input: {
    readonly clientId: string;
    readonly state: string;
    readonly redirectUri: string;
  }): string {
    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", input.clientId);
    url.searchParams.set("scope", "read_write");
    url.searchParams.set("state", input.state);
    url.searchParams.set("redirect_uri", input.redirectUri);
    return url.toString();
  }

  /**
   * Trades the authorization `code` Stripe sent back for the merchant's account id.
   *
   * @throws ProviderRefusedError when Stripe refuses the code (used, expired or for another platform).
   */
  async complete(
    code: string,
  ): Promise<{ readonly accountRef: string; readonly livemode: boolean }> {
    const grant = await this.api.post<StripeOAuthGrant>("/oauth/token", {
      grant_type: "authorization_code",
      code,
    });
    return { accountRef: grant.stripe_user_id, livemode: grant.livemode === true };
  }

  /**
   * Disconnects the merchant's account from the platform.
   *
   * @param clientId - the platform's Connect client id (`ca_…`).
   * @throws ProviderRefusedError when Stripe refuses (the account is not connected to this platform).
   */
  async revoke(clientId: string, accountRef: string): Promise<void> {
    await this.api.post("/oauth/deauthorize", { client_id: clientId, stripe_user_id: accountRef });
  }
}

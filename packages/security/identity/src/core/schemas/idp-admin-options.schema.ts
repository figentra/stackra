/**
 * Stackra file contract:
 * Purpose: `IdpAdminOptions`, the shape of `IdpAdminConfig`: where the identity provider's admin APIs are, the service
 *          account token they take, how long one call may take, and the signing key of the provider's auth-event
 *          calls.
 * Boundary: a shape class; it registers this package's own schema (`IDP_ADMIN_CONFIG_SCHEMA`) when the module loads.
 *           Managed or bring-your-own: runway's `config.idp_admin` layer sets the URL of the platform's ZITADEL or of
 *           the tenant's own instance, and the token is the `IDENTITY_IDP_ADMIN_TOKEN` secret of that instance's service
 *           account, read from the secret store. The `IDENTITY_IDP_EVENTS_SIGNING_KEY` secret is the signing key of the
 *           ZITADEL Actions v2 target that posts auth events (`ZitadelAuthEventsService`, STA-1579). Server only: never
 *           part of a browser build.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0173; ADR 0376 (managed or own accounts); ADR 0410;
 *                     STA-1579.
 */
import { Secret } from "@stackra/config";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { IDP_ADMIN_CONFIG_SCHEMA } from "#core/constants/idp-admin-config-schema.constant";

/**
 * The identity provider admin settings.
 *
 * @example
 * export class IdpAdminConfig extends BaseIdpAdminConfig {
 *   override timeoutSeconds = 30;
 * }
 */
export class IdpAdminOptions extends Schema {
  /** The service account's personal access token; empty until the secret is set. */
  @Secret("IDENTITY_IDP_ADMIN_TOKEN")
  token = "";

  /** Seconds one admin call may take before it counts as unavailable. */
  @Int({
    min: 1,
    max: 120,
  })
  timeoutSeconds = 15;

  /** The signing key of the provider's auth-event target; empty until the secret is set, and every call is refused. */
  @Secret("IDENTITY_IDP_EVENTS_SIGNING_KEY")
  eventsSigningKey = "";

  /** The provider's base URL (`https://id.stackra.app`); empty until runway sets it. */
  url = "";
}

registerSchemas([[IdpAdminOptions, IDP_ADMIN_CONFIG_SCHEMA]]);

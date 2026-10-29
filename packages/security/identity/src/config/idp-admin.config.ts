/**
 * Stackra file contract:
 * Purpose: `IdpAdminConfig`, the configuration of the identity provider admin driver (key `idp_admin`): the provider's
 *          URL, the service account token, the call timeout, and the signing key of its auth-event calls.
 * Boundary: a configuration class over `IdpAdminOptions` with no env map; runway's `config.idp_admin` layer sets the
 *           URL per environment (or per dedicated tenant with its own ZITADEL), and the `IDENTITY_IDP_ADMIN_TOKEN`
 *           secret comes from the secret store. Read by `ZitadelIdpAdminDriver`, and by `ZitadelAuthEventsService` for
 *           `eventsSigningKey` (the `IDENTITY_IDP_EVENTS_SIGNING_KEY` secret).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0410 (STA-834); STA-1579.
 */
import { Config } from "@stackra/config";

import { IdpAdminOptions } from "#core/schemas/idp-admin-options.schema";

/**
 * The identity provider admin configuration.
 *
 * @example
 * import { IdpAdminConfig as BaseIdpAdminConfig } from "@stackra/identity";
 *
 * export class IdpAdminConfig extends BaseIdpAdminConfig {
 *   override timeoutSeconds = 30;
 * }
 */
export class IdpAdminConfig extends Config({ schema: IdpAdminOptions }) {}

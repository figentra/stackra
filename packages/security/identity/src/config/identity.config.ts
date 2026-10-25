/**
 * Stackra file contract:
 * Purpose: `IdentityConfig`, the configuration of @stackra/identity (key `identity`): the flow per target, the public
 *          client of a device, the scopes, the BFF mount, the device redirect path, the route after sign-out, the idle
 *          rule and the refresh switches, read by the session drivers, the `SessionService` and gen's wiring; and the
 *          external providers, step-up, staff PIN, API key and verification settings their services read.
 * Boundary: the class is the DI token; it has no env map: the issuer and the client id are public values runway's
 *           `config.identity` layer sets per environment, and no secret ever lives here. A host overrides it under the
 *           same name, with this class aliased `BaseIdentityConfig`, by `override` members only; its presence mounts
 *           the session, so an app writes no session provider.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0295 (decision 10); ADR 0146 as amended; ADR 0206
 *                     (decision 8); ADR 0241.
 */
import { Config } from "@stackra/config";

import { IdentityOptions } from "#core/schemas/identity-options.schema";

/**
 * How a member signs in.
 *
 * @example
 * import { AuthFlow, IdentityConfig as BaseIdentityConfig } from "@stackra/identity";
 *
 * export class IdentityConfig extends BaseIdentityConfig {
 *   override flow: Record<string, AuthFlow> = { [Target.Web]: AuthFlow.Bff, [Target.Desktop]: AuthFlow.Pkce };
 *   override idleMinutes = 30;
 * }
 */
export class IdentityConfig extends Config({ schema: IdentityOptions }) {}

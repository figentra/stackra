/**
 * Stackra file contract:
 * Purpose: `IdentityOptions`, the shape of `IdentityConfig`: how each target signs in, the public client a device uses,
 *          what it asks the provider for, where the BFF is mounted, the device redirect path, the route after sign-out,
 *          the idle rule and when the session is read again.
 * Boundary: a shape class; it registers this package's own schema (`IDENTITY_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(IdentityConfig)` validates with no generated file. It holds no secret: a browser has
 *           no client credential (the BFF holds it, by name), and a device is a public client whose id and issuer are
 *           public values set per environment by runway's `config.identity` layer.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0241 (decisions 2 and 4); ADR 0277; ADR 0173 (secrets are names);
 *                     ADR 0294 (decisions 19 and 26).
 */
import { Target } from "@stackra/contracts";
import type { Url } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { IDENTITY_CONFIG_SCHEMA } from "#core/constants/identity-config-schema.constant";
import { AuthFlow } from "#core/enums/auth-flow.enum";

/**
 * The identity settings.
 *
 * @example
 * export class IdentityConfig extends BaseIdentityConfig {
 *   override idleMinutes = 30;
 * }
 */
export class IdentityOptions extends Schema {
  /** The flow per target code; gen's wiring picks the `SessionStore` driver of a target from it. */
  flow: Record<string, AuthFlow> = {
    [Target.Web]: AuthFlow.Bff,
    [Target.Pwa]: AuthFlow.Bff,
    [Target.Desktop]: AuthFlow.Pkce,
    [Target.Ios]: AuthFlow.Pkce,
    [Target.Android]: AuthFlow.Pkce,
  };

  /** The provider's issuer URL a PKCE client discovers its endpoints from; empty where only the BFF signs in. */
  issuer: Url | "" = "";

  /** The public client id a PKCE client presents; never a secret. Empty where only the BFF signs in. */
  clientId = "";

  /** Scopes requested at sign-in; `openid` always, `offline_access` for a refresh token. */
  scopes: string[] = ["openid", "profile", "email", "offline_access"];

  /** The BFF mount, relative to the API origin (`ClientsConfig.baseUrl`). */
  bffEndpoint = "/api/auth";

  /** The device redirect path; the platform's `SignInBrowser` turns it into `<scheme>://auth/callback`. */
  nativeRedirectPath = "auth/callback";

  /** The route reference the router lands on after sign-out; `null` stays on the sign-in route. */
  postLogoutRoute: object | null = null;

  /** Minutes without input before a signed-in client signs out (a shared till); `0` never signs out for idling. */
  idleMinutes = 0;

  /** Read the session again when a browser window becomes visible. */
  refreshOnFocus = true;

  /** Read the session again when a device app returns to the foreground (read by a device entry; none ships yet). */
  refreshOnForeground = true;
}

registerSchemas([[IdentityOptions, IDENTITY_CONFIG_SCHEMA]]);

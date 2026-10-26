/**
 * Stackra file contract:
 * Purpose: `IdentityOptions`, the shape of `IdentityConfig`: how each target signs in, the public client a device uses,
 *          what it asks the provider for, where the BFF is mounted, the device redirect path, the route after sign-out,
 *          the idle rule and when the session is read again; the external identity providers and the pack key that
 *          lists a market's, the assurance each method reaches and how long a step-up lasts, the staff PIN rules, the
 *          API key prefixes and how often a key's last use is written, the pack key of the verification providers and the desktop sign-in wait.
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
import { ApiKeyKind } from "#core/enums/api-key-kind.enum";
import { AssuranceLevel } from "#core/enums/assurance-level.enum";
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

  /** Read the session again when a device app returns to the foreground (read by a device entry). */
  refreshOnForeground = true;

  /** External identity provider key (a market pack's sign-in method, `nafath`) to its id at this deployment's provider. */
  externalProviders: Record<string, string> = {};

  /** The scope that sends the hosted sign-in straight to an external provider; `{id}` is the provider's id. */
  externalProviderScope = "urn:zitadel:iam:org:idp:id:{id}";

  /** The market-pack key listing the sign-in providers a market offers, in order. */
  signInProvidersKey = "identity.sign_in_providers";

  /** Authentication method (`amr`, RFC 8176) to the assurance level it reaches; the strongest method present wins. */
  assuranceByMethod: Record<string, AssuranceLevel> = {
    pwd: AssuranceLevel.Aal1,
    otp: AssuranceLevel.Aal2,
    sms: AssuranceLevel.Aal2,
    mfa: AssuranceLevel.Aal2,
    swk: AssuranceLevel.Aal2,
    user: AssuranceLevel.Aal2,
    hwk: AssuranceLevel.Aal3,
  };

  /** Minutes a step-up stays fresh: an action that needs one refuses an older authentication (ADR 0207: 10). */
  stepUpMaxAgeMinutes = 10;

  /** Digits a staff PIN has at least. */
  pinMinLength = 4;

  /** Digits a staff PIN has at most. */
  pinMaxLength = 8;

  /** PBKDF2-SHA-256 iterations a new staff PIN hash uses. */
  pinHashIterations = 600_000;

  /** Wrong PINs in a row before the staff member is locked out on that device. */
  pinMaxAttempts = 5;

  /** Minutes a PIN lockout lasts. */
  pinLockoutMinutes = 15;

  /** Seconds a manager override stays usable after the manager's PIN. */
  managerOverrideSeconds = 120;

  /** The prefix of each API key kind, registered with secret scanning (ADR 0278 decision 4). */
  apiKeyPrefixes: Record<ApiKeyKind, string> = {
    [ApiKeyKind.Secret]: "stackra_sk",
    [ApiKeyKind.Publishable]: "stackra_pk",
  };

  /**
   * Seconds a key's `lastUsedAt` may lag: a verification writes it only when it is older than this, so a busy key is
   * not a write per request. `0` writes on every verification.
   */
  apiKeyLastUsedSeconds = 60;

  /** The market-pack key mapping each verification kind to its providers, in the order they are tried. */
  verificationPackKey = "verification.drivers";

  /** Minutes a desktop sign-in waits for the browser to come back before it counts as closed. */
  signInTimeoutMinutes = 10;
}

registerSchemas([[IdentityOptions, IDENTITY_CONFIG_SCHEMA]]);

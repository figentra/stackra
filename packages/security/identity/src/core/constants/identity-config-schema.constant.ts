/**
 * Stackra file contract:
 * Purpose: `IDENTITY_CONFIG_SCHEMA`, the zod schema this package ships for `IdentityConfig` (exported as
 *          `IdentityConfig$`): the flow per target, the public client of a device, the scopes, the BFF mount, the
 *          device redirect path, the route after sign-out, the idle rule and the refresh switches, plus the external
 *          providers, the step-up rule, the staff PIN rules, the API key prefixes, the last-use write interval, the market-pack keys sign-in and
 *          verification read, and the app approval values (STA-1304).
 * Boundary: the stand-in for what gen writes for this package. Every field has a default and there is no object-level
 *           refinement, so `.parse({})` gives the full defaults and a member's generated `IdentityConfig$` extends it
 *           (`IdentityConfig$.shape.idleMinutes.unwrap().default(30)`). The rules sit on the fields: a flow is keyed by
 *           a known target, the issuer is an absolute URL or unset, the scopes are OAuth scope tokens with `openid`,
 *           the BFF mount is an absolute path, the redirect path is relative, and the idle rule fits a timer. The
 *           defaults equal `IdentityOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0206 (decision 8); ADR 0241; ADR 0277.
 */
import { Enum, Target } from "@stackra/contracts";
import { url } from "@stackra/validation";
import { z } from "zod";

import { ApiKeyKind } from "#core/enums/api-key-kind.enum";
import { AssuranceLevel } from "#core/enums/assurance-level.enum";
import { AuthFlow } from "#core/enums/auth-flow.enum";

/** An OAuth scope token (RFC 6749 section 3.3): no space, quote or backslash. */
const SCOPE_TOKEN = /^[^\s"\\]+$/;

/** An absolute path with no query or fragment (`/api/auth`). */
const MOUNT_PATH = /^\/[^\s?#]*$/;

/** A relative path with no query or fragment (`auth/callback`). */
const REDIRECT_PATH = /^[^/\s?#][^\s?#]*$/;

/** A dotted lowercase market-pack key (`identity.sign_in_providers`). */
const PACK_KEY = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

/** An API key prefix: lowercase letters, digits and underscores, no trailing underscore. */
const KEY_PREFIX = /^[a-z][a-z0-9_]*[a-z0-9]$/;

/** The target codes a flow may be keyed by. */
const TARGETS: readonly string[] = Enum.values(Target);

// shortcut: authored until gen compiles this package's IdentityOptions into #stackra/schemas; replace it with STA-339.
/** The shipped `IdentityConfig$`. */
export const IDENTITY_CONFIG_SCHEMA = z.object({
  flow: z
    .record(z.string(), z.enum(Enum.values(AuthFlow)))
    .refine((flow) => Object.keys(flow).every((target) => TARGETS.includes(target)), {
      message: "A flow is keyed by a target code",
    })
    .default(() => ({
      [Target.Web]: AuthFlow.Bff,
      [Target.Pwa]: AuthFlow.Bff,
      [Target.Desktop]: AuthFlow.Pkce,
      [Target.Ios]: AuthFlow.Pkce,
      [Target.Android]: AuthFlow.Pkce,
    })),
  issuer: z.union([url(), z.literal("")]).default(""),
  clientId: z.string().default(""),
  scopes: z
    .array(z.string().regex(SCOPE_TOKEN))
    .refine((scopes) => scopes.includes("openid"), { message: "The scopes include openid" })
    .default(() => ["openid", "profile", "email", "offline_access"]),
  bffEndpoint: z.string().regex(MOUNT_PATH).default("/api/auth"),
  nativeRedirectPath: z.string().regex(REDIRECT_PATH).default("auth/callback"),
  postLogoutRoute: z
    .custom<object>(
      (value) => value !== null && (typeof value === "object" || typeof value === "function"),
      { message: "A route reference" },
    )
    .nullable()
    .default(null),
  idleMinutes: z.number().int().min(0).max(1440).default(0),
  refreshOnFocus: z.boolean().default(true),
  refreshOnForeground: z.boolean().default(true),
  externalProviders: z.record(z.string().min(1), z.string().min(1)).default(() => ({})),
  externalProviderScope: z
    .string()
    .regex(/\{id\}/)
    .default("urn:zitadel:iam:org:idp:id:{id}"),
  signInProvidersKey: z.string().regex(PACK_KEY).default("identity.sign_in_providers"),
  assuranceByMethod: z
    .record(z.string().min(1), z.enum(Enum.values(AssuranceLevel)))
    .default(() => ({
      pwd: AssuranceLevel.Aal1,
      otp: AssuranceLevel.Aal2,
      sms: AssuranceLevel.Aal2,
      mfa: AssuranceLevel.Aal2,
      swk: AssuranceLevel.Aal2,
      user: AssuranceLevel.Aal2,
      hwk: AssuranceLevel.Aal3,
    })),
  stepUpMaxAgeMinutes: z.number().int().min(1).max(1440).default(10),
  pinMinLength: z.number().int().min(4).max(12).default(4),
  pinMaxLength: z.number().int().min(4).max(12).default(8),
  pinHashIterations: z.number().int().min(100_000).default(600_000),
  pinMaxAttempts: z.number().int().min(1).max(20).default(5),
  pinLockoutMinutes: z.number().int().min(1).max(1440).default(15),
  managerOverrideSeconds: z.number().int().min(10).max(3600).default(120),
  apiKeyPrefixes: z
    .object({
      [ApiKeyKind.Secret]: z.string().regex(KEY_PREFIX),
      [ApiKeyKind.Publishable]: z.string().regex(KEY_PREFIX),
    })
    .refine((prefixes) => prefixes.secret !== prefixes.publishable, {
      message: "Each API key kind has its own prefix",
    })
    .default(() => ({
      [ApiKeyKind.Secret]: "stackra_sk",
      [ApiKeyKind.Publishable]: "stackra_pk",
    })),
  apiKeyLastUsedSeconds: z.number().int().min(0).max(86_400).default(60),
  verificationPackKey: z.string().regex(PACK_KEY).default("verification.drivers"),
  signInTimeoutMinutes: z.number().int().min(1).max(60).default(10),
  signInMethodsKey: z.string().regex(PACK_KEY).default("identity.sign_in_methods"),
  appApprovalTtlSeconds: z.number().int().min(15).max(600).default(60),
  appApprovalDigits: z.number().int().min(2).max(4).default(2),
  appApprovalDecoys: z.number().int().min(1).max(8).default(3),
  appApprovalEnrolledDevicesOnly: z.boolean().default(true),
  appApprovalMaxRequests: z.number().int().min(1).max(100).default(5),
  appApprovalWindowMinutes: z.number().int().min(1).max(1440).default(15),
  appApprovalAssurance: z.enum(Enum.values(AssuranceLevel)).default(AssuranceLevel.Aal2),
});

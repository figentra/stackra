/**
 * Stackra file contract:
 * Purpose: `IdentityPlan`, what one ZITADEL instance holds: its domain and issuer, the environments it serves, the
 *          staff organisation, the project and its roles, the apps that have a callback there, the machine users,
 *          the branding, and Sign in with Apple.
 * Boundary: a type only; `identityPlan` builds it from the root runway and the seed, and `identityStack` creates it.
 *           Dev users are not in it: they seed the local container only.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 4, 5 and 8), ADR 0207 (decision 2), ADR 0268 (R3), ADR 0290 (decision 8),
 *                     STA-1578.
 */
import type { RunwayEnvironment } from "@stackra/runway";

import type { IdentityPlanApp } from "#core/types/identity-plan-app.type";
import type { IdentitySeed } from "#core/types/identity-seed.type";

/** One instance's plan. */
export type IdentityPlan = {
  /** The instance's name in `providers.zitadel.instances` (`nonprod`). */
  readonly instance: string;
  /** Its domain, the provider's endpoint (`id.staging.acme.example`). */
  readonly domain: string;
  /** Its OIDC issuer, the value each app's identity config reads (`https://id.staging.acme.example`). */
  readonly issuer: string;
  /** The runway environments it serves, in promotion order. */
  readonly environments: readonly RunwayEnvironment[];
  /** The staff organisation, which owns the project. */
  readonly org: IdentitySeed["org"];
  /** The project and its roles. */
  readonly project: IdentitySeed["project"];
  /** The apps with a callback (or the device code) on this instance. */
  readonly apps: readonly IdentityPlanApp[];
  /** The machine users, by member key. */
  readonly machines: IdentitySeed["machines"];
  /** The hosted pages' colours, or `null` to keep ZITADEL's. */
  readonly branding: NonNullable<IdentitySeed["branding"]> | null;
  /** The Apple identity provider's ids and key secret name, or `null` when the seed turns Apple off. */
  readonly appleSignIn: NonNullable<IdentitySeed["appleSignIn"]> | null;
};

/**
 * Stackra file contract:
 * Purpose: `DeployTarget`, one place a release lands: an environment's destination for one kind of member, in one of
 *          its regions, for the shared deployment or one dedicated tenant, with the destination's settings and the
 *          environment blocks a provider reads.
 * Boundary: type only; `deployTargets` builds it from a parsed root runway and the providers read it. Plain data: no
 *           secret, only names, keys and `ref:` values.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3: providers behind one port), ADR 0354 (decision 4), ADR 0400, OS-12 (a
 *                     release rolls region by region).
 */
import type { DeployKind } from "#core/enums/deploy-kind.enum";
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { EnvironmentCloud } from "#core/types/environment-cloud.type";
import type { RunwayRegion } from "#core/types/runway-region.type";

/** One deploy target. */
export interface DeployTarget {
  /** `<environment>/<kind>[/<region>][/dedicated:<key>]`, unique within a release and stable across releases. */
  readonly id: string;

  /** The environment whose release train this target rides. */
  readonly environment: RunwayEnvironment;

  /** The kind of member it ships. */
  readonly kind: DeployKind;

  /** The destination (`encore-cloud`, `eas`), the provider that serves it. */
  readonly destination: string;

  /** The region, when the environment (or dedicated deployment) lists regions. */
  readonly region?: RunwayRegion;

  /** The cloud of the environment or dedicated deployment, when the runway names it. */
  readonly cloud?: EnvironmentCloud;

  /** The dedicated deployment, when this target serves one tenant. */
  readonly dedicated?: { readonly key: string; readonly tenant: string };

  /** `targets.<destination>` of the root runway. */
  readonly settings: Readonly<Record<string, unknown>>;

  /**
   * The environment's blocks (`encore`, `mobile`, `desktop`), with a dedicated deployment's own blocks over them, for
   * the provider to read its part.
   */
  readonly scope: Readonly<Record<string, unknown>>;
}

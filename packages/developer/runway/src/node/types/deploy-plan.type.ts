/**
 * Stackra file contract:
 * Purpose: `DeployPlan`, what a deploy of one environment does (`runway plan`): each build-order target with its caller
 *          workflows, the CI secret names and the member secret and var names a deploy syncs.
 * Boundary: type only; names only, never a value.
 * Runtime: node
 * Governing contract: ADR 0170; STA-268.
 */

/** A deploy plan of one environment. */
export interface DeployPlan {
  /** The environment the plan is for. */
  readonly environment: string;
  /** The Infisical environment it maps to, or null when the root runway names none. */
  readonly infisicalEnvironment: string | null;
  /** Each build-order target with its caller workflows; `destination` when the environment deploys to it. */
  readonly steps: readonly {
    readonly target: string;
    readonly destination: boolean;
    readonly workflows: Readonly<Record<string, string>>;
  }[];
  /** The CI secret names the deploy jobs read. */
  readonly ci: readonly string[];
  /** The member secret and var names a deploy syncs into the runtimes (names only). */
  readonly sync: readonly (
    | {
        readonly member: string;
        readonly kind: "secret";
        readonly name: string;
        readonly path: string | null;
      }
    | { readonly member: string; readonly kind: "var"; readonly name: string }
  )[];
}

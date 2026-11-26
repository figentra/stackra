/**
 * Stackra file contract:
 * Purpose: `ConsumerGateProduct`, one consumer of the consumer gate matrix: repository, its pin and the date it was
 *          set, the services to gate and the services overlaid; for a `scaffold`, the starter profile, the service
 *          `stackra new service` adds and the fixture copied into it.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); ADR 0484; ADR 0515 (decision 3: `create --starter`); STA-1813; STA-2705.
 */

/**
 * One consumer the gate runs against a core tree. A `product` has a `repo` and exactly one of `ref` and `pins`; a
 * `scaffold` has a `repo` and a `ref` too, but they name the starter (the template `stackra create --starter` reads),
 * and the app is created from it, never copied.
 */
export type ConsumerGateProduct = {
  /** `product` (default, a checkout of a product repository) or `scaffold` (an app `stackra create` makes). */
  readonly kind?: "product" | "scaffold";

  /** The mode a run takes when `--mode` is not given; a scaffold is `pack` and refuses `link`. */
  readonly mode?: "link" | "pack";

  /** A scaffold's fixture folder (an action, a model with a migration and a test), relative to the core tree. */
  readonly fixture?: string;

  /** A scaffold's starter profile (`stackra create --profile`); `minimal` when absent. */
  readonly profile?: string;

  /** The service a scaffold adds with `stackra new service <name> --data`, the fixture copied into it. */
  readonly service?: string;

  /**
   * Packages a scaffold's fixture imports beyond what `stackra new service --data` declares, by name and spec: added
   * to that service's `package.json` dependencies, as a user's `pnpm add` would.
   */
  readonly dependencies?: Readonly<Record<string, string>>;

  /** The repository, `owner/name`: the product, or a scaffold's starter template. */
  readonly repo?: string;

  /** The commit every service of the product is pinned to (a scaffold: the starter's commit). */
  readonly ref?: string;

  /** A commit per service, when the services sit on different branches; one run gates services of one pin. */
  readonly pins?: Readonly<Record<string, string>>;

  /** The day the pin was last moved, `YYYY-MM-DD`; the summary flags a pin older than 14 days. */
  readonly pinned?: string;

  /** The services to gate. */
  readonly services: readonly string[];

  /** The services whose manifests are copied from the caller's overlay directory. */
  readonly overlays?: readonly string[];

  /** A narrower step list than every step. */
  readonly steps?: readonly string[];
};

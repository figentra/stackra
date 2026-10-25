/**
 * Stackra file contract:
 * Purpose: `ContainerOptions`, what `Container.create` takes beside the wirings: the root modules to boot, instances
 *          put in the place of tokens (config instances the config layers built, test fakes), and a driver choice that
 *          wins over config.
 * Boundary: a type only; strings are never tokens, so overrides are keyed by class or named token.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (decisions 1 and 12); ADR 0294 (decision 17).
 */
import type { DriverChoice } from "#core/types/driver-choice.type";
import type { ModuleClass } from "#core/types/module-class.type";
import type { Token } from "#core/types/token.type";

/** The options of `Container.create`. */
export interface ContainerOptions {
  /** The modules to boot; every wiring's root class when absent. Their bindings are built eagerly. */
  readonly roots?: readonly ModuleClass[];

  /** Instances returned as they are for their token, ahead of every binding. */
  readonly overrides?: ReadonlyMap<Token, object>;

  /** Driver names that win over the config selection. */
  readonly drivers?: DriverChoice;
}

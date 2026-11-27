/**
 * Stackra file contract:
 * Purpose: `BootOptions`, what a target's `createApp` hands `bootApp` beside the wiring: the root modules to boot, the
 *          raw environment its configuration classes read, runway's `config` values of every environment, and
 *          instances that win over every binding.
 * Boundary: a type only. The raw environment is the target's own (`process.env`, a Worker's bindings,
 *           `import.meta.env`); `bootApp` reads only the variables each configuration class maps, and picks the runway
 *           values of the running environment `readEnvironment` of @stackra/config reads from it (`dev` when unset; a
 *           name outside the closed list fails boot).
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 7 and 8); ADR 0294 (decision 19); ADR 0296 (decision 1: runway's values are
 *                     the last layer; amendment 2026-11-26); ADR 0263 (decisions 1 and 12); STA-2844; STA-2798.
 */
import type { ModuleClass, Token } from "@stackra/container";

/** The options of `bootApp`. */
export interface BootOptions {
  /** The modules to boot; the wiring's root class when absent. */
  readonly roots?: readonly ModuleClass[];

  /** The raw environment the configuration classes read their mapped variables and secrets from. */
  readonly env?: Readonly<Record<string, unknown>>;

  /**
   * Runway's `config` values (`#stackra/runway-config`): environment to config key (`actions.stores`) to the fields
   * that win over the environment. Only the running environment's are applied.
   */
  readonly runway?: Readonly<
    Record<string, Readonly<Record<string, Readonly<Record<string, unknown>>>>>
  >;

  /** Instances returned as they are for their token, ahead of every binding and configuration. */
  readonly overrides?: ReadonlyMap<Token, object>;
}

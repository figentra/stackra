/**
 * Stackra file contract:
 * Purpose: `WiringConfig`, one config class in a generated wiring: its key, the class consumers inject, and the host
 *          override that replaces it across the app, plus what the config package reads to layer values.
 * Boundary: a type only. The container binds `provide` to an instance of `override ?? provide` and reads driver
 *           selections from it; the values (env, runway, test values) are layered by @stackra/config, which hands the
 *           finished instance to the container as an override.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 19); ADR 0146 as amended by 0294; ADR 0263 (decision 9).
 */
import type { AnyClass } from "#core/types/any-class.type";

/** One config class. */
export interface WiringConfig {
  /** The config key (`loyalty_kit`, `logger.telemetry`), read by `selectedBy: "config:<key>.<field>"`. */
  readonly key: string;

  /** The class consumers inject. */
  readonly provide: AnyClass;

  /** The host's `<Host><Base>` subclass that replaces `provide`, when the host overrides it. */
  readonly override?: AnyClass;

  /** The options shape of the config class, for @stackra/config. */
  readonly schema?: unknown;

  /** Field name to environment variable, for @stackra/config. */
  readonly env?: Readonly<Record<string, string>>;

  /** Field name to secret name, for @stackra/config. */
  readonly secrets?: Readonly<Record<string, string>>;
}

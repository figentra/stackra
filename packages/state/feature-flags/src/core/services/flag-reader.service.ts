/**
 * Stackra file contract:
 * Purpose: `FlagReader`, the one place flag values are read: it asks the selected `FlagProvider` for the subject the
 *          configured targeting names, keeps the last answer, serves `get(ref)` synchronously (the provider's value or
 *          the flag's default) and notifies subscribers (`useFlag`) when values change.
 * Boundary: a singleton service; the host's flags context calls `watch(subjects)` with the caller's ids and stops it
 *           when they change. A failed load keeps the last values, so a provider outage never flips a flag; `load`
 *           rejects for its caller, `watch` swallows the rejection of its refreshes. Only the newest load is applied,
 *           so a slow answer for an old subject never overwrites a newer one. Builds no subject itself: the ids come
 *           from the host, which knows identity, tenancy and consent.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 3: targeting, drivers); ADR 0294 (decisions 16 and 17); ADR 0071 (ids only).
 */
import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import { FeatureFlagsConfig } from "#config/feature-flags.config";
import { FlagProvider } from "#contracts/ports/flag-provider.port";
import { FlagTargeting } from "#core/enums/flag-targeting.enum";
import type { FlagRef } from "#core/types/flag-ref.type";
import type { FlagSubjects } from "#core/types/flag-subjects.type";

/**
 * Reads flag values for the current caller.
 *
 * @example
 * const stop = reader.watch({ visitor: null, user: "usr_01J...", tenant: "ten_01J..." });
 * reader.get(Flags.orders.quick_order); // the provider's value, or the flag's default
 */
export class FlagReader extends Service {
  private readonly config: FeatureFlagsConfig;

  private readonly provider: FlagProvider;

  private current: Readonly<Record<string, boolean>> = {};

  private readonly listeners = new Set<() => void>();

  private loads = 0;

  /**
   * @param config - the targeting and the refresh interval.
   * @param provider - the selected driver.
   */
  constructor(config: FeatureFlagsConfig, provider: FlagProvider) {
    super();
    this.config = config;
    this.provider = provider;
  }

  /** The value of `ref`: the provider's last answer for it, or its declared default. */
  get(ref: FlagRef): boolean {
    return this.current[ref.key] ?? ref.default;
  }

  /**
   * Asks the provider for the subject the targeting names (the scope goes as the group) and applies the answer.
   *
   * @throws Error the provider's error; the last values stay.
   */
  async load(subjects: FlagSubjects): Promise<void> {
    const ticket = ++this.loads;
    const { targeting } = this.config;
    const values = await this.provider.values({
      // the targeting value stays "tenant" (stored config), the subject key is `scope`
      subject: targeting === FlagTargeting.Scope ? subjects.scope : subjects[targeting],
      scope: subjects.scope,
    });
    if (ticket === this.loads) this.publish(values);
  }

  /**
   * Loads now and again every `refreshEvery`, until the returned function is called.
   *
   * @returns stops the refreshes.
   */
  watch(subjects: FlagSubjects): () => void {
    const refresh = (): void => {
      // A failed refresh keeps the last values; `load` is the call that reports.
      this.load(subjects).catch(() => undefined);
    };
    refresh();
    const timer = setInterval(refresh, Duration.toMilliseconds(this.config.refreshEvery));
    return () => clearInterval(timer);
  }

  /**
   * Calls `listener` whenever values change; the shape `useSyncExternalStore` takes.
   *
   * @returns removes the listener.
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Replaces the values and notifies every subscriber; for a subclass that sets values itself (a fake). */
  protected publish(values: Readonly<Record<string, boolean>>): void {
    this.current = values;
    for (const listener of this.listeners) listener();
  }
}

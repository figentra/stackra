/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `FlagProvider` port, the one a test's `useDrivers("memory")` picks: it answers
 *          the values a test sets (`set(key, value)`), the same for every subject, starting empty so each flag keeps
 *          its declared default.
 * Boundary: no network; the values live on the instance. A reader picks a change up on its next `load` or `watch`
 *           tick; to flip a flag synchronously in a component test, bind `FlagsFake` in place of `FlagReader`.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 3); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";

import { FlagProvider } from "#contracts/ports/flag-provider.port";

/**
 * Serves the values a test sets.
 *
 * @example
 * (app.get(FlagProvider) as MemoryFlagProviderDriver).set("web.help_centre", true);
 */
export class MemoryFlagProviderDriver extends Driver(FlagProvider) {
  /** The values set so far, by flag key. */
  private readonly known: Record<string, boolean> = {};

  /**
   * Sets flag `key` (`web.help_centre`) to `value`; later calls for the same key win.
   *
   * @returns this driver, to chain.
   */
  set(key: string, value: boolean): this {
    this.known[key] = value;
    return this;
  }

  /** A copy of the values set so far, whoever asks. */
  values(): Promise<Readonly<Record<string, boolean>>> {
    return Promise.resolve({ ...this.known });
  }
}

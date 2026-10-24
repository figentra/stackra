/**
 * Stackra file contract:
 * Purpose: `FlagsFake`, the test double of `FlagReader`: a reader whose values a test sets synchronously
 *          (`fake.set(Flags.web.help_centre, true)`), bound in place of `FlagReader` (the testing module's
 *          `.override(FlagReader, fake)`, or the `flags` option of the React render helper).
 * Boundary: a real `FlagReader` (so `instanceof` holds and `useFlag` reads it unchanged) over the default
 *           configuration and a provider that answers with the values set so far, so a `load` or `watch` in the code
 *           under test keeps them. Makes no network call.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain fakes in the owning package's `./testing`); ADR 0266 (decision 2:
 *                     a fake per capability).
 */
import { FlagProvider } from "#contracts/index";
import { FeatureFlagsConfig, FlagReader } from "#core/index";
import type { FlagRef } from "#core/index";

/**
 * A flag reader with values set by the test.
 *
 * @example
 * const flags = new FlagsFake().set(Flags.web.pricing_yearly_first, true);
 */
export class FlagsFake extends FlagReader {
  private readonly fixed: Record<string, boolean>;

  constructor() {
    const fixed: Record<string, boolean> = {};
    const provider = Object.assign(Object.create(FlagProvider.prototype) as FlagProvider, {
      values: () => Promise.resolve({ ...fixed }),
    });
    super(new FeatureFlagsConfig(), provider);
    this.fixed = fixed;
  }

  /**
   * Sets `ref` to `value` now; later calls for the same flag win.
   *
   * @returns this fake, to chain.
   */
  set(ref: FlagRef, value: boolean): this {
    this.fixed[ref.key] = value;
    this.publish({ ...this.fixed });
    return this;
  }
}

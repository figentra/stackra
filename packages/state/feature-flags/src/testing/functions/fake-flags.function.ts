/**
 * Stackra file contract:
 * Purpose: `fakeFlags(configure)`, the helper a test sets flag values with: it builds a `FlagsFake`, hands it to
 *          `configure` and returns it, ready to bind in place of `FlagReader`.
 * Boundary: test code only; every flag not set keeps its declared default.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's tests (`fakeFlags((fake) => fake.set(ref, true))`).
 */
import { FlagsFake } from "#testing/flags.fake";

/**
 * A fake flag reader with the values `configure` sets.
 *
 * @example
 * const flags = fakeFlags((fake) => fake.set(Flags.web.help_centre, true));
 * render(<SiteHeader siteName="Acme" />, { flags });
 */
export function fakeFlags(configure?: (fake: FlagsFake) => unknown): FlagsFake {
  const fake = new FlagsFake();
  configure?.(fake);
  return fake;
}

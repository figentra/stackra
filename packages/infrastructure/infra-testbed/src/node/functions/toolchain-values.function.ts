/**
 * Stackra file contract:
 * Purpose: `toolchainValues(pins)`, the values the testbed image's components fill their `@@NAME@@` placeholders with,
 *          read from the plan's toolchain pins: one value per placeholder, each the pin of its tool; a pin the plan
 *          lacks, or holds empty, is an error naming the pin, so an image is never built with an empty version.
 * Boundary: pure; reads nothing but `pins`. `awsTestbed` calls it before it declares a resource, so a plan without a pin
 *           fails at once and not part-way through the program (or as a failed image build).
 * Runtime: node
 * Governing contract: ADR 0484 (decision 2); ADR 0171 (the program only declares).
 */

/** Each component placeholder and the toolchain pin it takes its value from. */
const PLACEHOLDER_PINS = {
  MISE: "mise",
  NODE: "node",
  PNPM: "pnpm",
  INFISICAL: "infisical",
  SHFMT: "shfmt",
  ENCORE: "encore",
  PLAYWRIGHT: "playwright",
  POSTGRES: "postgresImage",
} as const;

/**
 * The placeholder values of the image components for `pins`.
 *
 * @param pins - the plan's toolchain pins, by tool name.
 * @throws Error naming the pin when one a component needs is missing or empty.
 * @example
 * const values = toolchainValues(plan.toolchain); // { MISE: "v2026.10.0", NODE: "24.22.0", ... }
 */
export function toolchainValues(
  pins: Readonly<Record<string, string>>,
): Record<keyof typeof PLACEHOLDER_PINS, string> {
  const values: Partial<Record<keyof typeof PLACEHOLDER_PINS, string>> = {};
  for (const [placeholder, pin] of Object.entries(PLACEHOLDER_PINS)) {
    const value = pins[pin];
    if (value === undefined || value === "")
      throw new Error(
        `The testbed plan has no toolchain pin "${pin}", which the image components need`,
      );
    values[placeholder as keyof typeof PLACEHOLDER_PINS] = value;
  }
  return values as Record<keyof typeof PLACEHOLDER_PINS, string>;
}

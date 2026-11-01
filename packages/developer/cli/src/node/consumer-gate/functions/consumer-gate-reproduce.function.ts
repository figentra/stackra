/**
 * Stackra file contract:
 * Purpose: `consumerGateReproduce(flags)`, the one-line `stackra consumer-gate ...` command that re-runs an
 *          invocation: each given flag in a fixed order, a boolean flag bare, a value single-quoted when it needs it.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

const ORDER = [
  "core",
  "checkout",
  "product",
  "out",
  "mode",
  "matrix",
  "allow",
  "overlays",
  "services",
  "steps",
  "today",
  "dry-run",
];

const quote = (value: string): string =>
  /^[\w@%+=:,./-]+$/.test(value) ? value : `'${value.replaceAll("'", `'\\''`)}'`;

/**
 * The reproduce command.
 *
 * @param flags - flag name to its resolved value (`true` for a boolean flag, absent or `false` to omit).
 * @example
 * consumerGateReproduce({ core: "/c", product: "pay", "dry-run": true }); // "stackra consumer-gate --core /c --product pay --dry-run"
 */
export function consumerGateReproduce(
  flags: Readonly<Record<string, string | boolean | undefined>>,
): string {
  const parts = ORDER.flatMap((name) => {
    const value = flags[name];
    if (value === undefined || value === false) return [];
    return value === true ? [`--${name}`] : [`--${name}`, quote(value)];
  });
  return ["stackra", "consumer-gate", ...parts].join(" ");
}

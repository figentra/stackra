/**
 * Stackra file contract:
 * Purpose: `encoreHeldSecrets(listing, environment)`, the secret names Encore may already hold a value for in one
 *          environment, read from the overview table `encore secret list` prints (`Secret Key`, `Production`,
 *          `Development`, `Local`, `Preview`, `Specific Envs`; a ✓ or ✗ per environment type, then the specific
 *          environments by name). The secret sync asks it before it writes an empty placeholder, so a value set by
 *          hand in Encore is never replaced by an empty one (STA-258).
 * Boundary: pure; the table holds names and marks only, never a value. It leans towards "held": a row counts as held
 *           when any type column is not ✗ (the environment's type is not known here) or when its specific
 *           environments name `environment`; only a row of four ✗ that does not name it, or no row, is not held. A
 *           listing without the header answers null: the caller then cannot tell and writes no placeholder.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0371 (amendment 2026-11-27); STA-258.
 */

/** The terminal colour codes `encore secret list` puts around its marks. */
const ANSI = new RegExp(`${String.fromCodePoint(27)}\\[[0-9;]*m`, "g");

/** The mark of an environment type that holds no value. */
const NO = "✗";

/** The overview table's first header cell. */
const HEADER = /^Secret Key\s+Production\s+Development\s+Local\s+Preview\b/;

/**
 * The names `listing` shows as possibly holding a value in `environment`, or null when it is not the overview table.
 *
 * @example
 * encoreHeldSecrets("Secret Key   Production   Development   Local   Preview   Specific Envs\nSENTRY_DSN   ✓   ✗   ✗   ✗\n", "staging");
 * // Set { "SENTRY_DSN" }
 */
export function encoreHeldSecrets(
  listing: string,
  environment: string,
): ReadonlySet<string> | null {
  const lines = listing.replaceAll(ANSI, "").split("\n");
  const start = lines.findIndex((line) => HEADER.test(line.trim()));
  if (start === -1) return null;
  const held = new Set<string>();
  for (const line of lines.slice(start + 1)) {
    const [key, ...cells] = line.trim().split(/\s+/);
    if (key === undefined || key === "") continue;
    const marks = cells.slice(0, 4);
    const specific = cells
      .slice(4)
      .join(" ")
      .split(/[\s,]+/)
      .filter((name) => name !== "");
    const none = marks.length === 4 && marks.every((mark) => mark === NO);
    if (!none || specific.includes(environment)) held.add(key);
  }
  return held;
}

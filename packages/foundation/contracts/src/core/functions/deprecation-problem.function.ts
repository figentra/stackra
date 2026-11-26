/**
 * Stackra file contract:
 * Purpose: `deprecationProblem(value)`, what is wrong with a deprecation: options that are not `{ since, sunset,
 *          replacement? }`, a `since` or `sunset` that is neither a version nor a date (or not the same form), an empty
 *          replacement, or a sunset inside the deprecation window of `earliestSunset`.
 * Boundary: pure; `undefined` for a good deprecation. `@Deprecated` throws on a problem at class definition, and gen
 *           refuses it with the same code, so the rule has one home.
 * Runtime: isomorphic
 * Governing contract: ADR 0131 (decision 4); ADR 0136 (decision 4); ADR 0177 (decision 6); STA-2836.
 */
import { earliestSunset } from "#core/functions/earliest-sunset.function";
import { sunsetReached } from "#core/functions/sunset-reached.function";
import type { DeprecationProblem } from "#core/types/deprecation-problem.type";

/** The option names a deprecation takes. */
const KEYS: ReadonlySet<string> = new Set(["since", "sunset", "replacement"]);

/** A date version, `YYYY-MM-DD`. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A malformed-value problem. */
const invalid = (message: string): DeprecationProblem => ({ code: "deprecation_invalid", message });

/**
 * The problem of a deprecation, or `undefined` when it is well formed and its sunset is outside the window.
 *
 * @param value - the options a `@Deprecated` was called with, or a trait's `deprecated` option.
 * @example
 * deprecationProblem({ since: "0.34.0", sunset: "0.35.0", replacement: "OrderPlaced.total" }); // undefined
 * deprecationProblem({ since: "0.34.0", sunset: "0.34.9" })?.code; // "deprecation_window_short"
 * deprecationProblem({ since: "soon", sunset: "0.35.0" })?.code; // "deprecation_invalid"
 */
export function deprecationProblem(value: unknown): DeprecationProblem | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return invalid("the deprecation is not an object `{ since, sunset, replacement? }`");
  const record = value as Readonly<Record<string, unknown>>;
  const extra = Object.keys(record).filter((key) => !KEYS.has(key));
  if (extra.length > 0)
    return invalid(
      `the deprecation names ${extra.map((key) => `\`${key}\``).join(", ")}; it takes since, sunset and replacement`,
    );
  const { since, sunset, replacement } = record;
  const earliest = typeof since === "string" ? earliestSunset(since) : undefined;
  if (typeof since !== "string" || earliest === undefined)
    return invalid(
      `since ${JSON.stringify(since)} is neither a release version ("0.34.0") nor a date version ("2026-11-26")`,
    );
  if (typeof sunset !== "string" || earliestSunset(sunset) === undefined)
    return invalid(
      `sunset ${JSON.stringify(sunset)} is neither a release version ("0.35.0") nor a date ("2027-05-26")`,
    );
  if (DATE.test(since) !== DATE.test(sunset))
    return invalid(
      `since "${since}" and sunset "${sunset}" are not the same form: both release versions, or both dates`,
    );
  if (replacement !== undefined && (typeof replacement !== "string" || replacement.trim() === ""))
    return invalid("replacement is not a non-empty string; leave it out when nothing replaces it");
  if (!sunsetReached(earliest, sunset))
    return {
      code: "deprecation_window_short",
      message: DATE.test(since)
        ? `sunset "${sunset}" is inside the window: a public API deprecated on ${since} answers until ${earliest} at least (ADR 0136 decision 4)`
        : `sunset "${sunset}" is inside the window: an API deprecated in ${since} stays until ${earliest} at least (ADR 0177 decision 6: one minor before 1.0, one major after)`,
    };
  return undefined;
}

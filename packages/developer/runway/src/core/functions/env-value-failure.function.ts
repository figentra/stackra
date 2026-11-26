/**
 * Stackra file contract:
 * Purpose: `envValueFailure(row, value, environment)`, why one environment value breaks its declared rules, or
 *          `undefined` when it passes: missing (or empty while required), the type (`url`, `email`, `number`,
 *          `boolean`, `enum`), `Str`/`Int`/`Num` bounds, and the prefixes refused in that environment.
 * Boundary: pure; the reason names the rule, never the value or any part of it (a refused prefix is named as the
 *           declared prefix, which is code, not a value).
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import type { EnvRow } from "#core/types/env-row.type";

/** A numeric option of a rule, when set. */
function option(options: unknown, key: string): number | undefined {
  const value = (options as Record<string, unknown> | undefined)?.[key];
  return typeof value === "number" ? value : undefined;
}

/**
 * The first broken rule of `value`, or `undefined`.
 *
 * @example
 * envValueFailure({ name: "STRIPE_SECRET_KEY", refuse: { production: ["sk_test_"] } }, v, "production");
 * // "refused prefix sk_test_ in production" when it starts with sk_test_
 */
export function envValueFailure(
  row: EnvRow,
  value: string | undefined,
  environment: string,
): string | undefined {
  if (value === undefined || value === "")
    return row.required === false ? undefined : value === undefined ? "missing" : "empty";
  for (const prefix of row.refuse?.[environment] ?? [])
    if (value.startsWith(prefix)) return `refused prefix ${prefix} in ${environment}`;
  const type = row.type;
  if (type === "url" && !/^[a-z][a-z0-9+.-]*:\/\/[^/\s]/i.test(value)) return "not a url";
  if (type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return "not an email";
  if (type === "number" && !Number.isFinite(Number(value))) return "not a number";
  if (type === "boolean" && value !== "true" && value !== "false") return "not true or false";
  if (type === "enum" && !(row.values ?? []).includes(value))
    return "not one of the declared values";
  for (const rule of row.rules ?? []) {
    const min = option(rule.options, "min");
    const max = option(rule.options, "max");
    const measure = rule.name === "Str" ? value.length : Number(value);
    if (rule.name !== "Str" && rule.name !== "Int" && rule.name !== "Num") continue;
    if (rule.name === "Int" && !Number.isInteger(measure)) return "not an integer";
    if (min !== undefined && measure < min) return `${rule.name} min ${min}`;
    if (max !== undefined && measure > max) return `${rule.name} max ${max}`;
  }
  return undefined;
}

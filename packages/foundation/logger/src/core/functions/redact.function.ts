/**
 * Stackra file contract:
 * Purpose: `redact`, the one redaction every log line passes before any reporter sees it: masks fields by name (the
 *          built-in list plus a host's extra fields), fields a shape class marks `@Classified`, and secret shapes
 *          inside any string; turns errors, dates and bigints into JSON-safe values.
 * Boundary: returns a new value and never mutates its input. Cycles become `"[circular]"` and nesting deeper than
 *           eight levels `"[truncated]"`, so a log call can never hang or overflow. An error keeps its name, message,
 *           stack, cause and own enumerable fields, each redacted like any other value.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1: redaction by classification, with secret detection); ADR 0134
 *                     (classification); ADR 0071; ADR 0184 (decision 5: logs carry no personal data).
 */
import type { AnyClass } from "@stackra/container";
import { Classified } from "@stackra/validation";

import { REDACTED_FIELDS } from "#core/constants/redacted-fields.constant";
import { SECRET_PATTERNS } from "#core/constants/secret-patterns.constant";

/** What a masked value is replaced with. */
const MASK = "[redacted]";

/** How deep `redact` walks before it stops. */
const MAX_DEPTH = 8;

/** A field name in the form the lists hold: lower case, letters and digits only. */
function normalise(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** `text` with every secret shape masked. */
function scrub(text: string): string {
  return SECRET_PATTERNS.reduce((current, pattern) => current.replace(pattern, MASK), text);
}

/** The fields of an error worth logging; its own enumerable fields (`code`, ...) included. */
function errorFields(error: Error): Record<string, unknown> {
  return {
    name: error.name,
    message: error.message,
    ...(error.stack === undefined ? {} : { stack: error.stack }),
    ...(error.cause === undefined ? {} : { cause: error.cause }),
    ...Object.fromEntries(Object.entries(error)),
  };
}

/**
 * A redacted, JSON-safe copy of `value`.
 *
 * @param value - the fields of a log call, or any value inside them.
 * @param extraFields - field names to mask besides the built-in list (`LoggingConfig.redaction.extraFields`).
 * @example
 * redact({ customerId: "usr_1", cause: error }, ["customerId"]);
 * // { customerId: "[redacted]", cause: { name: "TypeError", message: "...", stack: "..." } }
 */
export function redact(value: unknown, extraFields: readonly string[] = []): unknown {
  const names = [...REDACTED_FIELDS, ...extraFields.map(normalise)].filter((name) => name !== "");
  const path = new WeakSet<object>();
  const masked = (key: string): boolean => {
    const name = normalise(key);
    return names.some((candidate) => name.endsWith(candidate));
  };

  const walk = (current: unknown, depth: number): unknown => {
    if (typeof current === "string") return scrub(current);
    if (typeof current === "bigint") return current.toString();
    if (current === null || typeof current !== "object") return current;
    if (current instanceof Date)
      return Number.isNaN(current.getTime()) ? null : current.toISOString();
    if (path.has(current)) return "[circular]";
    if (depth >= MAX_DEPTH) return "[truncated]";
    path.add(current);
    try {
      if (Array.isArray(current)) return current.map((item: unknown) => walk(item, depth + 1));
      const prototype = Object.getPrototypeOf(current) as object | null;
      const classified =
        prototype === null || prototype === Object.prototype
          ? undefined
          : Classified.members(current.constructor as AnyClass);
      const source = current instanceof Error ? errorFields(current) : current;
      const copy: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(source))
        copy[key] = masked(key) || classified?.has(key) === true ? MASK : walk(item, depth + 1);
      return copy;
    } finally {
      // Only the current path counts as a cycle; the same object twice side by side is logged twice.
      path.delete(current);
    }
  };

  return walk(value, 0);
}

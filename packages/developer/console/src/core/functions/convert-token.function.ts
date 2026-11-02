/**
 * Stackra file contract:
 * Purpose: `convertToken(field, token)`, one command-line token (or prompt answer) converted to the field's value
 *          kind and checked against its choices, bounds and pattern; a secret value is never echoed in the message.
 * Boundary: pure; throws a `UsageError` naming the field.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-009 and FR-010; STA-1966 spec FR-018.
 */
import type { CommandField } from "#contracts/types/command-field.type";
import { UsageError } from "#core/errors/usage.error";
import { isSecret } from "#core/functions/is-secret.function";

/** One token converted to the field's kind and checked against its bounds. */
export function convertToken(field: CommandField, token: string): unknown {
  const name = field.role === "option" ? `--${field.flag}` : `<${field.flag}>`;
  // A secret value is never echoed: the message reaches stderr and `--json`.
  const shown = isSecret(field) ? "[redacted]" : `"${token}"`;
  if (field.choices !== undefined && !field.choices.includes(token))
    throw new UsageError(
      `${name} must be one of ${field.choices.join(", ")}, got ${shown}`,
      `Pass one of: ${field.choices.join(", ")}`,
    );
  if (field.kind === "string") {
    if (field.min !== undefined && token.length < field.min)
      throw new UsageError(`${name} must be at least ${field.min} characters, got ${shown}`);
    if (field.max !== undefined && token.length > field.max)
      throw new UsageError(`${name} must be at most ${field.max} characters, got ${shown}`);
    if (field.pattern !== undefined && !new RegExp(field.pattern, "u").test(token))
      throw new UsageError(`${name} does not match /${field.pattern}/, got ${shown}`);
    return token;
  }
  const value = token.trim() === "" ? Number.NaN : Number(token);
  if (!Number.isFinite(value) || (field.kind === "integer" && !Number.isInteger(value)))
    throw new UsageError(
      `${name} must be ${field.kind === "integer" ? "a whole number" : "a number"}, got ${shown}`,
    );
  if (field.min !== undefined && value < field.min)
    throw new UsageError(`${name} must be at least ${field.min}, got ${value}`);
  if (field.max !== undefined && value > field.max)
    throw new UsageError(`${name} must be at most ${field.max}, got ${value}`);
  return value;
}

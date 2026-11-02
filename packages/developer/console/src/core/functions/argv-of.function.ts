/**
 * Stackra file contract:
 * Purpose: `argvOf(structure, input)`, the command line a tool call stands for: the command's name, its arguments in
 *          field order after `--`, and `--flag=value` per option (`--flag`/`--no-flag` for a boolean, one per item of a
 *          list), so the kernel parses and checks a tool call as it parses a typed line, and no value reads as a flag.
 * Boundary: pure; throws a `UsageError` for a key that is not a field or a value that is not a scalar.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-020.
 */
import type { CommandStructure } from "#contracts/types/command-structure.type";
import { UsageError } from "#core/errors/usage.error";

/** One value as a token. */
function tokenOf(name: string, value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return String(value);
  throw new UsageError(`${name} must be a string, a number or a boolean`);
}

/** The argument vector of a call of `structure` with `input`. */
export function argvOf(structure: CommandStructure, input: unknown): string[] {
  const given = (typeof input === "object" && input !== null ? input : {}) as Record<
    string,
    unknown
  >;
  const fields = new Map(
    [...structure.arguments, ...structure.options].map((field) => [field.property, field]),
  );
  for (const key of Object.keys(given))
    if (!fields.has(key)) throw new UsageError(`${structure.name} has no input "${key}"`);
  // Options as `--flag=value` and arguments after `--`, so a value that starts with `-` stays a value.
  const argv = [structure.name];
  for (const field of structure.options) {
    const value = given[field.property];
    if (value === undefined) continue;
    if (field.kind === "boolean")
      argv.push(value === true ? `--${field.flag}` : `--no-${field.flag}`);
    else
      for (const item of Array.isArray(value) ? value : [value])
        argv.push(`--${field.flag}=${tokenOf(field.property, item)}`);
  }
  const positionals = structure.arguments.flatMap((field) => {
    const value = given[field.property];
    if (value === undefined) return [];
    return (Array.isArray(value) ? value : [value]).map((item) => tokenOf(field.property, item));
  });
  if (positionals.length > 0) argv.push("--", ...positionals);
  return argv;
}

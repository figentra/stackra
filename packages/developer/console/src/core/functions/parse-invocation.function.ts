/**
 * Stackra file contract:
 * Purpose: `parseInvocation(tokens, structure?)`, the global options and the field values of one invocation, parsed by
 *          `node:util.parseArgs` (strict, negatable flags, repeated list options, `--`), with numbers converted and
 *          bounds, missing arguments and surplus tokens reported as a `UsageError`.
 * Boundary: pure apart from `parseArgs`; never constructs a command. With no structure only global options are
 *           accepted. A missing argument is not an error when `--help` is given.
 * Runtime: isomorphic (`node:util` is in every runtime Stackra targets for a CLI)
 * Governing contract: STA-1730 spec FR-009, FR-010 and FR-015; spec 030 Requirement 3.
 */
import { parseArgs } from "node:util";
import type { ParseArgsConfig } from "node:util";

import { GLOBAL_OPTIONS } from "#core/constants/global-options.constant";
import { UsageError } from "#core/errors/usage.error";
import type { CommandField } from "#core/types/command-field.type";
import type { CommandStructure } from "#core/types/command-structure.type";
import type { GlobalFlags } from "#core/types/global-flags.type";
import type { ParsedInvocation } from "#core/types/parsed-invocation.type";

/** The parseArgs options of the global options and of `fields`. */
function optionsOf(fields: readonly CommandField[]): NonNullable<ParseArgsConfig["options"]> {
  const options: NonNullable<ParseArgsConfig["options"]> = { ...GLOBAL_OPTIONS };
  for (const field of fields)
    options[field.flag] = {
      type: field.kind === "boolean" ? "boolean" : "string",
      multiple: field.list,
      ...(field.short === undefined ? {} : { short: field.short }),
    };
  return options;
}

/** One token converted to the field's kind and checked against its bounds. */
function convert(field: CommandField, token: string): unknown {
  const name = field.role === "option" ? `--${field.flag}` : `<${field.flag}>`;
  if (field.kind === "string") {
    if (field.min !== undefined && token.length < field.min)
      throw new UsageError(`${name} must be at least ${field.min} characters, got "${token}"`);
    if (field.max !== undefined && token.length > field.max)
      throw new UsageError(`${name} must be at most ${field.max} characters, got "${token}"`);
    if (field.pattern !== undefined && !new RegExp(field.pattern, "u").test(token))
      throw new UsageError(`${name} does not match /${field.pattern}/, got "${token}"`);
    return token;
  }
  const value = token.trim() === "" ? Number.NaN : Number(token);
  if (!Number.isFinite(value) || (field.kind === "integer" && !Number.isInteger(value)))
    throw new UsageError(
      `${name} must be ${field.kind === "integer" ? "a whole number" : "a number"}, got "${token}"`,
    );
  if (field.min !== undefined && value < field.min)
    throw new UsageError(`${name} must be at least ${field.min}, got ${value}`);
  if (field.max !== undefined && value > field.max)
    throw new UsageError(`${name} must be at most ${field.max}, got ${value}`);
  return value;
}

/** The global options in `values`. */
function globalsOf(values: Record<string, unknown>): GlobalFlags {
  return {
    help: values["help"] === true,
    version: values["version"] === true,
    verbose: values["verbose"] === true,
    quiet: values["quiet"] === true,
    interaction: values["interaction"] !== false,
    json: values["json"] === true,
    ansi: typeof values["ansi"] === "boolean" ? values["ansi"] : undefined,
  };
}

/** The global options alone, read leniently, so a bad token never hides `--json` or `--help`. */
function looseGlobals(tokens: readonly string[]): GlobalFlags {
  const { values } = parseArgs({
    args: [...tokens],
    options: { ...GLOBAL_OPTIONS },
    strict: false,
    allowPositionals: true,
    allowNegative: true,
  });
  return globalsOf(values);
}

/** Parses `tokens` (the invocation without its command name) for `structure`, or for the global options alone. */
export function parseInvocation(
  tokens: readonly string[],
  structure?: CommandStructure,
): ParsedInvocation {
  const fields = structure === undefined ? [] : [...structure.arguments, ...structure.options];
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs({
      args: [...tokens],
      options: optionsOf(structure?.options ?? []),
      strict: true,
      allowPositionals: true,
      allowNegative: true,
    });
  } catch (error) {
    const message = (error as Error).message.replace(/\. To specify a positional.*$/s, "");
    return { globals: looseGlobals(tokens), values: {}, error: new UsageError(message) };
  }
  const globals = globalsOf(parsed.values);
  const values: Record<string, unknown> = {};
  try {
    for (const field of structure?.options ?? []) {
      const given = parsed.values[field.flag];
      if (given === undefined) continue;
      values[field.property] =
        field.kind === "boolean"
          ? given
          : Array.isArray(given)
            ? given.map((token) => convert(field, String(token)))
            : convert(field, String(given));
    }
    const positionals = [...parsed.positionals];
    for (const field of structure?.arguments ?? []) {
      if (positionals.length === 0) {
        if (field.required && !globals.help)
          throw new UsageError(
            `The argument <${field.flag}> is missing`,
            `Run with --help to see its usage`,
          );
        continue;
      }
      values[field.property] = field.list
        ? positionals.splice(0).map((token) => convert(field, token))
        : convert(field, positionals.shift() ?? "");
    }
    if (positionals.length > 0)
      throw new UsageError(
        structure === undefined || fields.length === 0
          ? `Unexpected argument "${positionals[0]}"`
          : `Too many arguments: "${positionals[0]}" has no place`,
      );
  } catch (error) {
    if (error instanceof UsageError) return { globals, values: {}, error };
    throw error;
  }
  return { globals, values };
}

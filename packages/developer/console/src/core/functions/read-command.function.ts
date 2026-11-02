/**
 * Stackra file contract:
 * Purpose: `readCommand(type)`, the structure of a command class: its kind options, its `@Argument` and `@Option`
 *          fields in declaration order with their value kinds (from `@Str`, `@Int`, `@Num`, `@List`), defaults and
 *          bounds; read once per class and frozen.
 * Boundary: reads decorator records and builds one instance with no arguments for the field initialisers; never runs
 *           `handle`. Refuses a wrong declaration with `ConsoleDeclarationError` (FR-005).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-001 to FR-005; ADR 0294 (decisions 6 and 25).
 */
import { kindOf } from "@stackra/container";
import { Int, List, Num, Str } from "@stackra/validation";

import type { CommandOptions } from "#contracts/types/command-options.type";
import { GLOBAL_OPTIONS } from "#core/constants/global-options.constant";
import { Argument } from "#core/decorators/argument.decorator";
import { Option } from "#core/decorators/option.decorator";
import { ConsoleDeclarationError } from "#core/errors/console-declaration.error";
import type { CommandClass } from "#core/types/command-class.type";
import type { CommandField } from "#contracts/types/command-field.type";
import type { CommandStructure } from "#contracts/types/command-structure.type";
import type { ValueKind } from "#contracts/types/value-kind.type";

/** Structures already read, by class. */
const READ = new WeakMap<CommandClass, CommandStructure>();

/** Long names and letters a command field may not take. */
const RESERVED_LONG = new Set([...Object.keys(GLOBAL_OPTIONS), "no-interaction", "no-ansi"]);
const RESERVED_SHORT = new Set([
  ...Object.values(GLOBAL_OPTIONS).flatMap((option) =>
    option.short === undefined ? [] : [option.short],
  ),
  "n",
]);

/** `dryRun` → `dry-run`. */
const kebab = (property: string) =>
  property.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** The field initialisers, read from an instance built with no arguments; empty when the constructor throws. */
function defaultsOf(type: CommandClass): Readonly<Record<string, unknown>> {
  try {
    return Reflect.construct(type, []) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** The value kind and bounds of one field, from the validation decorators on it. */
function valueOf(type: CommandClass, property: string, role: CommandField["role"]) {
  const int = Int.members(type).get(property);
  const num = Num.members(type).get(property);
  const str = Str.members(type).get(property);
  const list = List.members(type).has(property);
  const rules = int ?? num ?? str;
  const kind: ValueKind =
    int !== undefined
      ? "integer"
      : num !== undefined
        ? "number"
        : str !== undefined || list || role === "argument"
          ? "string"
          : "boolean";
  return {
    kind,
    list,
    ...(rules?.min === undefined ? {} : { min: rules.min }),
    ...(rules?.max === undefined ? {} : { max: rules.max }),
    ...(str?.pattern === undefined ? {} : { pattern: str.pattern.source }),
  };
}

/**
 * The structure of `type`, read once.
 *
 * @throws ConsoleDeclarationError when the class is not a command or a field is declared wrongly.
 */
export function readCommand(type: CommandClass): CommandStructure {
  const cached = READ.get(type);
  if (cached !== undefined) return cached;
  const record = kindOf(type);
  if (record?.kind !== "command")
    throw new ConsoleDeclarationError(type.name, "it does not extend Command({ ... })");
  const options = record.options as unknown as Required<
    Omit<CommandOptions, "group" | "docs" | "tool">
  > &
    Pick<CommandOptions, "group" | "docs" | "tool">;
  const label = `${type.name} (${options.name})`;
  const defaults = defaultsOf(type);
  const argumentRecords = Argument.members(type);
  const optionRecords = Option.members(type);
  const flags = new Map<string, string>();
  const claim = (name: string, property: string) => {
    const holder = flags.get(name);
    if (holder !== undefined)
      throw new ConsoleDeclarationError(label, `${property} and ${holder} both use "${name}"`);
    flags.set(name, property);
  };

  const argumentFields: CommandField[] = [];
  for (const [key, given] of argumentRecords) {
    const property = String(key);
    if (optionRecords.has(key))
      throw new ConsoleDeclarationError(label, `${property} is both an @Argument and an @Option`);
    const value = valueOf(type, property, "argument");
    const initial = defaults[property];
    const previous = argumentFields.at(-1);
    // A prompted argument is asked for, so the invocation may leave it out.
    const required =
      initial === undefined && given.optional !== true && given.prompt === undefined && !value.list;
    if (previous?.list === true)
      throw new ConsoleDeclarationError(
        label,
        `${property} follows the list argument ${previous.property}`,
      );
    if (required && previous?.required === false)
      throw new ConsoleDeclarationError(
        label,
        `the required argument ${property} follows the optional ${previous.property}`,
      );
    const flag = kebab(property);
    claim(flag, property);
    argumentFields.push(
      Object.freeze({
        property,
        flag,
        role: "argument",
        ...value,
        required,
        ...(initial === undefined ? {} : { default: initial }),
        ...(given.description === undefined ? {} : { description: given.description }),
        ...(given.secret === true ? { secret: true } : {}),
        ...(given.prompt === undefined ? {} : { prompt: given.prompt }),
        ...(given.choices === undefined ? {} : { choices: Object.freeze([...given.choices]) }),
      }),
    );
  }

  const optionFields: CommandField[] = [];
  for (const [key, given] of optionRecords) {
    const property = String(key);
    const flag = kebab(property);
    if (RESERVED_LONG.has(flag))
      throw new ConsoleDeclarationError(label, `--${flag} (${property}) is a global option`);
    if (given.short !== undefined) {
      if (!/^[A-Za-z]$/.test(given.short))
        throw new ConsoleDeclarationError(
          label,
          `-${given.short} (${property}) must be one letter`,
        );
      if (RESERVED_SHORT.has(given.short))
        throw new ConsoleDeclarationError(
          label,
          `-${given.short} (${property}) is a global option`,
        );
      claim(`-${given.short}`, property);
    }
    claim(flag, property);
    // An option with choices takes one of them, so it is a string even without @Str.
    const read = valueOf(type, property, "option");
    const value =
      given.choices !== undefined && read.kind === "boolean"
        ? { ...read, kind: "string" as const }
        : read;
    const initial = defaults[property];
    optionFields.push(
      Object.freeze({
        property,
        flag,
        role: "option",
        ...value,
        required: false,
        ...(initial === undefined ? {} : { default: initial }),
        ...(given.short === undefined ? {} : { short: given.short }),
        ...(given.description === undefined ? {} : { description: given.description }),
        ...(given.secret === true ? { secret: true } : {}),
        ...(given.prompt === undefined ? {} : { prompt: given.prompt }),
        ...(given.choices === undefined ? {} : { choices: Object.freeze([...given.choices]) }),
      }),
    );
  }

  const structure: CommandStructure = Object.freeze({
    name: options.name,
    description: options.description,
    hidden: options.hidden,
    aliases: options.aliases,
    audit: options.audit,
    bin: options.bin,
    examples: options.examples,
    ...(options.group === undefined ? {} : { group: options.group }),
    ...(options.docs === undefined ? {} : { docs: options.docs }),
    ...(options.tool === undefined || options.tool === false
      ? {}
      : { tool: { readOnly: options.tool !== true && options.tool.readOnly } }),
    arguments: Object.freeze(argumentFields),
    options: Object.freeze(optionFields),
  });
  READ.set(type, structure);
  return structure;
}

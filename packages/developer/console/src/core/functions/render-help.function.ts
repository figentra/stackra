/**
 * Stackra file contract:
 * Purpose: `renderHelp(structure, binary, painter)`, a command's help in the Symfony shape: description, usage,
 *          arguments (required or not, default), options (short, long, value, default) and the global options.
 * Boundary: pure; returns the lines.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-014; spec 030 Requirement 5.4.
 */
import { GLOBAL_OPTIONS } from "#core/constants/global-options.constant";
import { padTo } from "#core/functions/pad-to.function";
import type { CommandField } from "#core/types/command-field.type";
import type { CommandStructure } from "#core/types/command-structure.type";
import type { Painter } from "#core/types/painter.type";

/** The left column of an option: `-s, --shout` or `    --times=TIMES`. */
function optionLabel(field: Pick<CommandField, "flag" | "kind" | "short" | "list">): string {
  const value = field.kind === "boolean" ? "" : `=${field.flag.toUpperCase().replaceAll("-", "_")}`;
  return `${field.short === undefined ? "    " : `-${field.short}, `}--${field.flag}${value}${field.list ? " (multiple)" : ""}`;
}

/** The right column: the description and the default. */
function describe(field: CommandField): string {
  const fallback =
    field.default === undefined || field.default === false
      ? ""
      : ` [default: ${JSON.stringify(field.default)}]`;
  return `${field.description ?? ""}${fallback}`.trim();
}

/** The help lines of `structure`, run as `binary`. */
export function renderHelp(
  structure: CommandStructure,
  binary: string,
  painter: Painter,
): string[] {
  const heading = (text: string) => painter.warning(`${text}:`);
  const usage = [
    binary,
    structure.name,
    "[options]",
    ...structure.arguments.map((field) => {
      const name = `<${field.flag}>${field.list ? "..." : ""}`;
      return field.required ? name : `[${name}]`;
    }),
  ].join(" ");
  const rows: [string, string][] = [
    ...structure.options.map((field): [string, string] => [optionLabel(field), describe(field)]),
    ...Object.entries(GLOBAL_OPTIONS).map(([flag, option]): [string, string] => [
      optionLabel({
        flag,
        kind: "boolean",
        list: false,
        ...(option.short === undefined ? {} : { short: option.short }),
      }),
      option.description,
    ]),
  ];
  const width =
    Math.max(
      ...rows.map(([left]) => left.length),
      ...structure.arguments.map((field) => field.flag.length),
    ) + 2;
  const lines = [
    "",
    heading("Description"),
    `  ${structure.description}`,
    "",
    heading("Usage"),
    `  ${usage}`,
  ];
  if (structure.aliases.length > 0)
    lines.push(`  ${painter.dim(`aliases: ${structure.aliases.join(", ")}`)}`);
  if (structure.arguments.length > 0) {
    lines.push("", heading("Arguments"));
    for (const field of structure.arguments)
      lines.push(`  ${painter.success(padTo(field.flag, width))}${describe(field)}`.trimEnd());
  }
  lines.push("", heading("Options"));
  for (const [left, right] of rows)
    lines.push(`  ${painter.success(padTo(left, width))}${right}`.trimEnd());
  lines.push("");
  return lines;
}

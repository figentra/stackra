/**
 * Stackra file contract:
 * Purpose: `commandsOf`, the `commands` manifest section (ADR 0506 decision 4): one row per `Command` class of the
 *          member (`name`, `aliases`, `hidden`, `audit`, `bin`, `class`, `file`, `entry`, `module?`), then, for a
 *          service or app, the rows of every hosted package marked `from: <package>`, except a package's `bin` rows;
 *          and the refusals gen can see: `identity_missing` (no written `name`), `kind_path` (a command outside its
 *          kind's home group) and `command_collision` (two rows share a name or an alias).
 * Boundary: pure. Options are read as the constants gen found in `Command({...})`. A command's home is
 *           `src/modules/<key>/commands/` in a service or worker, `src/node/commands/` in a package and
 *           `src/commands/` (or a module's `commands/`) in an app. A package's rows are exactly its commands that sit in
 *           `src/node/`, so the `./node` entry exports them; a `bin: true` row is the package's own binary command and
 *           is never merged into a host.
 * Runtime: isomorphic
 * Governing contract: ADR 0506 (decisions 4 and 6); STA-1731 spec FR-001 to FR-005; ADR 0294 (decision 22: a refusal
 *                     carries its fix).
 */
import type { Json } from "@stackra/contracts";

import { entryOf } from "#core/functions/entry-of.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A manifest row. */
type Entry = { [key: string]: Json };

/** The home of a command file, by member layout. */
const HOMES: Readonly<Record<MemberIR["layout"], RegExp>> = {
  package: /^src\/node\/commands\/[^/]+\.command\.ts$/,
  service: /^src\/modules\/[^/]+\/commands\/[^/]+\.command\.ts$/,
  worker: /^src\/modules\/[^/]+\/commands\/[^/]+\.command\.ts$/,
  app: /^src\/(?:modules\/[^/]+\/)?commands\/[^/]+\.command\.ts$/,
};

/** Where a command may live, for the refusal's fix. */
const HOME_TEXT: Readonly<Record<MemberIR["layout"], string>> = {
  package: "src/node/commands/<name>.command.ts",
  service: "src/modules/<module>/commands/<name>.command.ts",
  worker: "src/modules/<module>/commands/<name>.command.ts",
  app: "src/commands/<name>.command.ts",
};

/** The names a row answers to. */
function namesOf(row: Entry): string[] {
  return [String(row["name"]), ...(row["aliases"] as readonly string[])];
}

/** Where a row comes from, for a message. */
function whereOf(row: Entry): string {
  return typeof row["from"] === "string" ? String(row["from"]) : String(row["file"]);
}

/**
 * The commands of `ir`, and what is wrong with them.
 *
 * @param ir - the member read by discovery.
 * @returns the rows (own first, then hosted) and the refusals.
 * @example
 * commandsOf(ir).commands[0];
 * // { name: "db:migrate", aliases: [], hidden: false, audit: true, bin: false, class: "DbMigrateCommand", ... }
 */
export function commandsOf(ir: MemberIR): {
  readonly commands: readonly Entry[];
  readonly errors: readonly GenError[];
} {
  const rows: Entry[] = [];
  const errors: GenError[] = [];
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "command")) {
    const fail = (code: string, message: string, fix: string): void => {
      errors.push({
        code,
        file: declared.file,
        line: 0,
        column: 0,
        subject: declared.name,
        message,
        fix,
      });
    };
    if (!HOMES[ir.layout].test(declared.file))
      fail(
        "kind_path",
        `a command lives in its kind's \`commands/\` group, not ${declared.file}`,
        `move it to \`${HOME_TEXT[ir.layout]}\``,
      );
    const name = declared.options["name"];
    if (typeof name !== "string") {
      fail(
        "identity_missing",
        "command has no written `name`",
        'write `Command({ name: "db:migrate", description: "..." })`',
      );
      continue;
    }
    const aliases = declared.options["aliases"];
    rows.push({
      name,
      aliases: Array.isArray(aliases) ? aliases.map(String) : [],
      hidden: declared.options["hidden"] === true,
      audit: declared.options["audit"] === true,
      bin: declared.options["bin"] === true,
      class: declared.name,
      file: declared.file,
      entry: entryOf(declared.file) ?? "index",
      ...(declared.file.startsWith("src/modules/") ? { module: declared.module } : {}),
    });
  }
  if (ir.layout !== "package")
    for (const dependency of ir.dependencies) {
      if (dependency.manifest["kind"] === "app") continue;
      for (const item of (dependency.manifest.commands ?? []) as unknown as readonly Entry[])
        if (item["bin"] !== true) rows.push({ ...item, from: item["from"] ?? dependency.package });
    }

  const seen = new Map<string, Entry>();
  for (const row of rows)
    for (const name of namesOf(row)) {
      const other = seen.get(name);
      if (other !== undefined && other !== row)
        errors.push({
          code: "command_collision",
          file: typeof row["from"] === "string" ? "stackra.manifest.json" : String(row["file"]),
          line: 0,
          column: 0,
          subject: name,
          message: `\`${name}\` is declared by ${String(other["class"])} (${whereOf(other)}) and by ${String(row["class"])} (${whereOf(row)})`,
          fix: "rename one command or alias, or stop hosting the package that declares it",
        });
      else seen.set(name, row);
    }
  return { commands: rows, errors };
}

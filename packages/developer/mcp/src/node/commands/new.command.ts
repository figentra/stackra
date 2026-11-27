/**
 * Stackra file contract:
 * Purpose: `NewCommand`, the `new` tool of the local MCP: runs `stackra new <kind> <name>` with the options the CLI
 *          takes for it, where `kind` is one of `NEW_KINDS` (exactly the kinds the CLI makes) and `name` is kebab-case,
 *          and returns the run with its output (the files written, or why it refused).
 * Boundary: runs through the CLI runner only, so `new`'s own refusals apply (a folder that exists, an unknown category
 *           or area). Writes only inside the new member's folder: `--repo`, which writes into another checkout, is not
 *           offered. Every option is passed as `--flag=value`, so no value reads as a flag.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: create members and kinds); ADR 0294 (rule R12); STA-2873.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { Int, Str } from "@stackra/validation";

import { NEW_KINDS } from "#node/constants/new-kinds.constant";
import { runToolCommand } from "#node/functions/run-tool-command.function";
import type { DevToolHost } from "#core/ports/dev-tool-host.port";

/** A kebab-case name, as `stackra new` requires. */
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** Creates a member. */
export class NewCommand extends Command({
  name: "new",
  description:
    "Create a member with `stackra new <kind> <name>`: a package, service, seed pack, tooling preset or app " +
    "(console, mobile, desktop, docs); returns the files written",
  bin: true,
  tool: { readOnly: false, destructive: false, idempotent: false },
}) {
  /** What to create. */
  @Argument({
    description: "What to create",
    choices: [...NEW_KINDS],
  })
  kind!: string;

  /** The new member's name. */
  @Argument({ description: "Its kebab-case name, such as `loyalty-kit`" })
  @Str({
    pattern: KEBAB,
    message: "a kebab-case name, such as loyalty-kit",
  })
  name!: string;

  /** A package's category. */
  @Option({ description: "A package's category: a folder under packages/ (such as `data`)" })
  @Str
  category?: string;

  /** A service's API area. */
  @Option({ description: "A service's API area (an ApiArea code)" })
  @Str
  area?: string;

  /** The package description. */
  @Option({ description: "The package.json description (a template kind requires it)" })
  @Str
  description?: string;

  /** The one-line summary. */
  @Option({ description: "The one-line summary (a template kind requires it)" })
  @Str
  summary?: string;

  /** The npm scope. */
  @Option({
    description:
      "The npm scope: a product key or an @npm-scope; the root runway's product when absent",
  })
  @Str
  scope?: string;

  /** Regenerate over an existing member. */
  @Option({
    description: "Regenerate over an existing member: write only missing files, diff the rest",
  })
  over = false;

  /** The package.json keywords. */
  @Option({ description: "package.json keywords, comma-separated" })
  @Str
  keywords?: string;

  /** An app's title. */
  @Option({ description: "An app's title" })
  @Str
  title?: string;

  /** An app's dev port. */
  @Option({ description: "An app's dev port" })
  @Int({
    min: 1,
    max: 65_535,
  })
  port?: number;

  /** Report what would be written. */
  @Option({ description: "Say what would be written without writing" })
  dryRun = false;

  /** A package's entries. */
  @Option({ description: "A package's optional entries: react,native or none" })
  @Str
  entries?: string;

  /** Add the database folders. */
  @Option({ description: "Add the database folders to a package or service" })
  data = false;

  /** The server's runner and environment; absent when the kernel builds the command to read its fields. */
  private readonly host: DevToolHost | undefined;

  constructor(host: DevToolHost) {
    super();
    this.host = host;
  }

  /** Runs `stackra new`. */
  handle(io: CommandIo): Promise<number> {
    const values: [string, string | number | undefined][] = [
      ["category", this.category],
      ["area", this.area],
      ["description", this.description],
      ["summary", this.summary],
      ["scope", this.scope],
      ["keywords", this.keywords],
      ["title", this.title],
      ["port", this.port],
      ["entries", this.entries],
    ];
    return runToolCommand(io, this.host, [
      "new",
      this.kind,
      this.name,
      ...values.flatMap(([flag, value]) => (value === undefined ? [] : [`--${flag}=${value}`])),
      ...(this.over ? ["--over"] : []),
      ...(this.dryRun ? ["--dry-run"] : []),
      ...(this.data ? ["--data"] : []),
    ]);
  }
}

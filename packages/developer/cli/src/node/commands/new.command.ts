/**
 * Stackra file contract:
 * Purpose: `NewCommand`, `stackra new <kind> <name>`: writes a new member in the v3 shape (a package, service or seed
 *          pack from the CLI's own templates, a tooling preset or an app from `tools/scaffold/templates`), or regenerates
 *          one with `--over`. The body is `NEW_COMMAND`, unchanged; every option it reads is a field here. In a
 *          terminal, what the kind needs and the line left out is asked first (`askNew`): the kind, the name, a
 *          service's area, a package's category, a template's description and summary.
 * Boundary: writes only inside the one member folder (the body's rules); never installs or runs gen.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0294 (rule R12); ADR 0295; ADR 0349 (decision 2); ADR 0506; ADR 0500 (decision 7);
 *                     STA-1210; STA-2883.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { NEW_COMMAND } from "#node/constants/new-command.constant";
import { askNew } from "#node/functions/ask-new.function";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Creates a member. */
export class NewCommand extends Command({
  name: "new",
  description: NEW_COMMAND.summary,
  group: "Create",
  bin: true,
  examples: [
    "stackra new service billing --area admin",
    "stackra new package loyalty-kit --category commerce",
    'stackra new app:docs handbook --description "A handbook." --summary "Use it for the team docs."',
  ],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = NEW_COMMAND;

  /** What to create: package, service, seed-pack, tooling or an app:<console|mobile|desktop|docs> */
  @Argument({
    description:
      "What to create: package, service, seed-pack, tooling or an app:<console|mobile|desktop|docs>",
    optional: true,
  })
  @Str
  kind?: string;

  /** Its name, in kebab-case (such as loyalty-kit) */
  @Argument({
    description: "Its name, in kebab-case (such as loyalty-kit)",
    optional: true,
  })
  @Str
  name?: string;

  /** A package's folder under packages/, such as data */
  @Option({ description: "A package's folder under packages/, such as data" })
  @Str
  category?: string;

  /** A service's API area */
  @Option({ description: "A service's API area" })
  @Str
  area?: string;

  /** One sentence: the package.json description, and the opening of README.md and AGENTS.md */
  @Option({
    description:
      "One sentence: the package.json description, and the opening of README.md and AGENTS.md",
  })
  @Str
  description?: string;

  /** One sentence for agents: when to reach for the member (stackra.summary) */
  @Option({
    description: "One sentence for agents: when to reach for the member (stackra.summary)",
  })
  @Str
  summary?: string;

  /** The npm scope: a product key (velora) or a scope (default: the root runway product). */
  @Option({
    description:
      "The npm scope: a product key (velora) or @scope (default: the root runway's product)",
  })
  @Str
  scope?: string;

  /** Regenerate over an existing member: write the missing files, show a diff for the rest */
  @Option({
    description:
      "Regenerate over an existing member: write the missing files, show a diff for the rest",
  })
  over = false;

  /** A template's keywords, comma-separated */
  @Option({ description: "A template's keywords, comma-separated" })
  @Str
  keywords?: string;

  /** A template app's title */
  @Option({ description: "A template app's title" })
  @Str
  title?: string;

  /** A template app's dev port (default: the first free one) */
  @Option({ description: "A template app's dev port (default: the first free one)" })
  @Str
  port?: string;

  /** Create it in this repository folder instead of this workspace */
  @Option({ description: "Create it in this repository folder instead of this workspace" })
  @Str
  repo?: string;

  /** List what would be written; write nothing */
  @Option({ description: "List what would be written; write nothing" })
  dryRun = false;

  /** A package's optional entries: react, native, both comma-separated, or none */
  @Option({
    description: "A package's optional entries: react, native, both comma-separated, or none",
  })
  @Str
  entries?: string;

  /** A package with database folders, or a service with its database */
  @Option({ description: "A package with database folders, or a service with its database" })
  data = false;

  /** Asks what the kind needs (in a terminal), then writes the member; the exit code is the body's. */
  async handle(io: CommandIo): Promise<number> {
    const answers = await askNew(
      io,
      {
        kind: this.kind,
        name: this.name,
        category: this.category,
        area: this.area,
        description: this.description,
        summary: this.summary,
        repo: this.repo,
        entries: this.entries,
        data: this.data,
      },
      io.cwd,
    );
    return runBody(io, NEW_COMMAND, {
      values: {
        category: answers.category,
        area: answers.area,
        description: answers.description,
        summary: answers.summary,
        scope: this.scope,
        over: this.over,
        keywords: this.keywords,
        title: this.title,
        port: this.port,
        repo: this.repo,
        "dry-run": this.dryRun,
        entries: this.entries,
        data: this.data,
      },
      positionals: [answers.kind, answers.name].filter(
        (word): word is string => word !== undefined,
      ),
    });
  }
}

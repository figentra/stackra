/**
 * Stackra file contract:
 * Purpose: `DbSeedCommand`, `db:seed --pack <pack>`: reports the records of a seed pack the seed ledger holds, by kind
 *          and owner, through `seedState`.
 * Boundary: reads `database.seed_records` only. Planning and writing a pack's records (`applySeed`) needs the pack's
 *           declared records, which `stackra seed-pack` plans, so this command writes nothing. Audited.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-001 and FR-015; ADR 0396 (decision 1).
 */
import { commandEnvironment } from "#node/functions/command-environment.function";
import { Command, Option } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import type { DatabaseRunner } from "#node/services/database-runner.service";

/** Shows a seed pack's stored records. */
export class DbSeedCommand extends Command({
  name: "db:seed",
  description: "Show the stored records of a seed pack",
  audit: true,
}) {
  /** The pack, for example `seed-pack:commerce`. */
  @Option({ description: "The seed pack, for example seed-pack:commerce" })
  @Str
  pack = "";

  /** The member's root folder. */
  @Option({ description: "The member's folder; the current folder by default" })
  @Str
  cwd = process.cwd();

  /** The runway environment. */
  @Option({
    description: "The environment; STACKRA_ENVIRONMENT, else dev; never one that contradicts it",
  })
  @Str
  env = "";

  /** The runner the command calls. */
  private readonly runner: DatabaseRunner;

  /**
   * @param runner - the migration and seed runner.
   */
  constructor(runner: DatabaseRunner) {
    super();
    this.runner = runner;
  }

  /** Reads the ledger and returns the records. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const environment = commandEnvironment(this.env);
    const pack =
      this.pack !== ""
        ? this.pack
        : await io.prompt.text({ message: "Which seed pack?", option: "pack" });
    const records = await io.output.task(`Reading ${pack}`, () =>
      this.runner.seedState({ cwd: this.cwd, environment: environment, pack }),
    );
    io.output.table(
      ["Kind", "Key", "Owner"],
      records.map((record) => [record.kind, record.key, record.owner]),
    );
    return { pack, records };
  }
}

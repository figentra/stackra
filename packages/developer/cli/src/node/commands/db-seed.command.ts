/**
 * Stackra file contract:
 * Purpose: `DbSeedCommand`, `stackra db seed`: runs the member's seeders of a profile (`minimal` first), each in its own
 *          transaction through the member's booted container, skipping one unchanged since it last ran. The body is
 *          `DB_SEED_COMMAND`, unchanged.
 * Boundary: the connection comes from the member's environment, never an argument; the production guard is the body's.
 * Runtime: node
 * Governing contract: ADR 0190 (profiles); ADR 0325 (decision 7); ADR 0282 (decision 3); ADR 0506; ADR 0500 (decision 7); STA-1709;
 *                     STA-2883.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { DB_SEED_COMMAND } from "#node/constants/db-seed-command.constant";
import { SEED_PROFILES } from "#node/constants/seed-profiles.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Runs the member's seeders. */
export class DbSeedCommand extends Command({
  name: "db:seed",
  description: DB_SEED_COMMAND.summary,
  group: "Database",
  bin: true,
  examples: ["stackra db seed", "stackra db seed --profile demo --env preview"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = DB_SEED_COMMAND;

  /** The seed profile; minimal runs first */
  @Option({
    description: "The seed profile; minimal runs first",
    choices: Object.keys(SEED_PROFILES),
  })
  @Str
  profile = "minimal";

  /** dev, preview, test, staging or production (default: STACKRA_ENVIRONMENT, else dev) */
  @Option({
    description:
      "dev, preview, test, staging or production (default: STACKRA_ENVIRONMENT, else dev)",
  })
  @Str
  env?: string;

  /** Run only this module's seeders */
  @Option({ description: "Run only this module's seeders" })
  @Str
  module?: string;

  /** Run every seeder, even one unchanged since it last ran */
  @Option({ description: "Run every seeder, even one unchanged since it last ran" })
  again = false;

  /** Allow a seed run against production (the demo and test profiles never run there) */
  @Option({
    description: "Allow a seed run against production (the demo and test profiles never run there)",
  })
  allowProduction = false;

  /** Seeds; the exit code is the seed run's. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, DB_SEED_COMMAND, {
      values: {
        profile: this.profile,
        env: this.env,
        module: this.module,
        again: this.again,
        "allow-production": this.allowProduction,
      },
    });
  }
}

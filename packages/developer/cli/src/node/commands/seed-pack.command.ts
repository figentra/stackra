/**
 * Stackra file contract:
 * Purpose: `SeedPackCommand`, `stackra seed-pack <product>`: checks a product's seed pack (`--check`), or seeds one profile
 *          without touching a record a tenant changed, then runs the member's seeders of the same profile. The body is
 *          `SEED_PACK_COMMAND`, unchanged.
 * Boundary: runs in the member's folder through its own `@stackra/database/node`; the rows are the pack's data.
 * Runtime: node
 * Governing contract: ADR 0325 (decision 7); ADR 0190 (decision 1); config-model section 6; ADR 0282 (decision 3); ADR 0506; ADR 0500
 *                     (decision 7); STA-2883.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { SEED_PACK_COMMAND } from "#node/constants/seed-pack-command.constant";
import { SEED_PROFILES } from "#node/constants/seed-profiles.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Checks or seeds a product's seed pack. */
export class SeedPackCommand extends Command({
  name: "seed-pack",
  description: SEED_PACK_COMMAND.summary,
  group: "Database",
  bin: true,
  examples: ["stackra seed-pack velora --check", "stackra seed-pack velora --profile demo"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = SEED_PACK_COMMAND;

  /** The product whose seed pack it reads (seed-pack:<product>) */
  @Argument({
    description: "The product whose seed pack it reads (seed-pack:<product>)",
    optional: true,
  })
  @Str
  product?: string;

  /** The seed profile */
  @Option({
    description: "The seed profile",
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

  /** Check the pack and report each profile; seed nothing */
  @Option({ description: "Check the pack and report each profile; seed nothing" })
  check = false;

  /** Allow a seed run against production */
  @Option({ description: "Allow a seed run against production" })
  allowProduction = false;

  /** Checks or seeds; the exit code is the body's. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, SEED_PACK_COMMAND, {
      values: {
        profile: this.profile,
        env: this.env,
        check: this.check,
        "allow-production": this.allowProduction,
      },
      positionals: this.product === undefined ? [] : [this.product],
    });
  }
}

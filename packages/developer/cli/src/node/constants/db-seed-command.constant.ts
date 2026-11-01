/**
 * Stackra file contract:
 * Purpose: `DB_SEED_COMMAND`, `stackra db seed [--profile minimal|demo|test] [--env <environment>] [--module <key>]
 *          [--again] [--allow-production]`: runs the member's seeders of a profile (`minimal` first), each in its own
 *          transaction through the member's booted container, skipping one unchanged since it last ran.
 * Boundary: `runDbSeed` does the work: the profile check, the production guard, the member's build and its seed
 *           entry. The connection comes from the member's environment (`directDatabaseUrl()`), never an argument.
 * Runtime: node
 * Governing contract: ADR 0190 (profiles); ADR 0325 (decision 7); ADR 0282 (decision 3); STA-1709.
 */
import { SEED_PROFILES } from "#node/constants/seed-profiles.constant";
import { databaseEnvironment } from "#node/functions/database-environment.function";
import { runDbSeed } from "#node/functions/run-db-seed.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra db seed`. */
export const DB_SEED_COMMAND: CliCommand = {
  name: "db seed",
  summary:
    "Run the member's seeders of a profile, each in its own transaction, skipping unchanged ones",
  usage: `stackra db seed [--profile ${Object.keys(SEED_PROFILES).join("|")}] [--env <environment>] [--module <key>] [--again] [--allow-production]`,
  options: {
    profile: { type: "string" },
    env: { type: "string" },
    module: { type: "string" },
    again: { type: "boolean" },
    "allow-production": { type: "boolean" },
  },
  run({ cwd, values, io }) {
    return runDbSeed({
      cwd,
      profile: typeof values["profile"] === "string" ? values["profile"] : "minimal",
      environment: databaseEnvironment(values),
      io,
      module: typeof values["module"] === "string" ? values["module"] : undefined,
      again: values["again"] === true,
      allowProduction: values["allow-production"] === true,
    });
  },
};

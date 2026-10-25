/**
 * Stackra file contract:
 * Purpose: `SEED_PACK_COMMAND`, `stackra seed-pack <product> [--profile minimal|demo|test] [--env <environment>]
 *          [--check]`: reads and checks `seed-pack:<product>`; with `--check` it reports each profile and stops;
 *          otherwise it plans the profile against what the member's seed runner already stores and writes only new
 *          records and seed-owned records whose content changed, never a record a tenant changed.
 * Boundary: runs in the member's folder through its own `@stackra/database/node`; the CLI holds no database driver
 *           and decides no value: the rows are the pack's data.
 * Runtime: node
 * Governing contract: ADR 0325 (decision 7: seeds are resumable and tested); ADR 0190 (decision 1: profiles);
 *                     config-model section 6 (owner principle "configuration, not code"); ADR 0282 (decision 3).
 */
import { SEED_PROFILES } from "#node/constants/seed-profiles.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { databaseEnvironment } from "#node/functions/database-environment.function";
import { findSeedPack } from "#node/functions/find-seed-pack.function";
import { loadSeedRunner } from "#node/functions/load-seed-runner.function";
import { planSeed } from "#node/functions/plan-seed.function";
import { readSeedPack } from "#node/functions/read-seed-pack.function";
import { seedRecordsFor } from "#node/functions/seed-records-for.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra seed-pack`. */
export const SEED_PACK_COMMAND: CliCommand = {
  name: "seed-pack",
  summary: "Check a product's seed pack, or seed one profile without touching tenant values",
  usage: `stackra seed-pack <product> [--profile ${Object.keys(SEED_PROFILES).join("|")}] [--env <environment>] [--check]`,
  options: { profile: { type: "string" }, env: { type: "string" }, check: { type: "boolean" } },
  positionals: true,
  async run({ cwd, positionals, values, io }) {
    const [product, ...extra] = positionals;
    if (product === undefined)
      throw new CliUsageError("name the product: stackra seed-pack <product>");
    if (extra.length > 0) throw new CliUsageError(`unexpected argument: ${extra[0]}`);
    const pack = readSeedPack(findSeedPack(cwd, product));

    if (values["check"] === true) {
      io.out(`${pack.key}@${pack.version}: valid\n`);
      for (const profile of Object.keys(SEED_PROFILES)) {
        const records = seedRecordsFor(pack, profile);
        const rows = records.reduce((total, record) => total + record.rows.length, 0);
        io.out(`  ${profile}  ${records.length} records, ${rows} rows\n`);
      }
      return 0;
    }

    const profile = typeof values["profile"] === "string" ? values["profile"] : "minimal";
    const records = seedRecordsFor(pack, profile);
    const environment = databaseEnvironment(values);
    const runner = await loadSeedRunner(cwd);
    const plan = planSeed(records, await runner.seedState({ cwd, environment, pack: pack.key }));
    const changes = [...plan.insert, ...plan.update];
    const { written } =
      changes.length === 0
        ? { written: [] as readonly string[] }
        : await runner.applySeed({
            cwd,
            environment,
            pack: pack.key,
            version: pack.version,
            profile,
            records: changes,
          });
    io.out(
      `${pack.key}@${pack.version} ${profile} (${environment}): ${plan.insert.length} new, ${plan.update.length} updated, ` +
        `${plan.unchanged.length} current, ${plan.kept.length} kept as the tenant changed them\n` +
        written.map((id) => `  ${id}\n`).join(""),
    );
    return 0;
  },
};

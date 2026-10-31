/**
 * Stackra file contract:
 * Purpose: `checkSeedGuard`, the checks every seeding run passes first: a known profile, and on `production` no `demo`
 *          or `test` profile and no `--again` unless `--allow-production` is given.
 * Boundary: pure; `runDbSeed` and `stackra seed-pack` call it before they write anything, so a refused production run
 *           leaves the database as it was.
 * Runtime: node
 * Governing contract: ADR 0190 (profiles); STA-1709 (the production guard).
 */
import { SEED_PROFILES } from "#node/constants/seed-profiles.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";

/**
 * Refuses a seeding run the guard does not allow.
 *
 * @throws CliUsageError for an unknown profile, or a production run without `allowProduction`.
 * @example
 * checkSeedGuard({ profile: "demo", environment: "production" }); // throws: pass --allow-production
 */
export function checkSeedGuard(options: {
  readonly profile: string;
  readonly environment: string;
  readonly again?: boolean | undefined;
  readonly allowProduction?: boolean | undefined;
}): void {
  const { profile, environment } = options;
  if (SEED_PROFILES[profile] === undefined)
    throw new CliUsageError(
      `unknown profile: ${profile} (expected ${Object.keys(SEED_PROFILES).join(", ")})`,
    );
  if (environment !== "production" || options.allowProduction === true) return;
  if (profile !== "minimal")
    throw new CliUsageError(
      `the ${profile} profile is refused on production: pass --allow-production to seed it there`,
    );
  if (options.again === true)
    throw new CliUsageError(
      "--again is refused on production: pass --allow-production to re-run every seeder there",
    );
}

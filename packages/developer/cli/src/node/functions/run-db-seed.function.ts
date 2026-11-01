/**
 * Stackra file contract:
 * Purpose: `runDbSeed`, the seeding step `stackra db seed` and `stackra seed-pack` share: checks the profile and the
 *          production guard, builds the member (its own `tsdown`, which builds `.stackra/entry/seed.ts`) and runs the
 *          built seed entry with the profile, module, `--again` and who ran it.
 * Boundary: the CLI loads nothing of the member: the member's own build and Node run its seeders against
 *           `directDatabaseUrl()`. On `production` the `demo` and `test` profiles and `--again` are refused without
 *           `allowProduction`, and every production run prints who ran it; the seed ledger records it too. A member
 *           without a seed entry has no seeders: nothing runs and the answer is 0.
 * Runtime: node
 * Governing contract: ADR 0190 (profiles); ADR 0325 (decision 7); ADR 0282 (decision 3); STA-1709.
 */
import { existsSync } from "node:fs";
import { userInfo } from "node:os";
import { join } from "node:path";

import { checkSeedGuard } from "#node/functions/check-seed-guard.function";
import { runProcess } from "#node/functions/run-process.function";
import type { CliIo } from "#node/types/cli-io.type";

/** Who runs the seeders: the actor CI or the caller names, else the OS user. */
function actor(): string {
  return process.env["STACKRA_ACTOR"] ?? process.env["GITHUB_ACTOR"] ?? userInfo().username;
}

/**
 * Seeds the member at `cwd`.
 *
 * @returns the exit code: 0, the build's when it fails, or the seed entry's.
 * @throws CliUsageError for an unknown profile, or a production run the guard refuses (`checkSeedGuard`).
 * @example
 * await runDbSeed({ cwd, profile: "demo", environment: "preview", io });
 */
export async function runDbSeed(options: {
  readonly cwd: string;
  readonly profile: string;
  readonly environment: string;
  readonly io: CliIo;
  readonly module?: string | undefined;
  readonly again?: boolean | undefined;
  readonly allowProduction?: boolean | undefined;
}): Promise<number> {
  const { cwd, profile, environment, io } = options;
  checkSeedGuard(options);
  if (!existsSync(join(cwd, ".stackra", "entry", "seed.ts"))) {
    io.out(`db seed (${environment}): no seeders\n`);
    return 0;
  }
  const ranBy = actor();
  if (environment === "production") io.out(`db seed (production): ${profile}, run by ${ranBy}\n`);
  const built = await runProcess({ command: "tsdown", args: [], cwd }, io);
  if (built !== 0) return built;
  return runProcess(
    {
      command: process.execPath,
      args: [
        join("dist", "seed.mjs"),
        "--profile",
        profile,
        "--ran-by",
        ranBy,
        ...(options.module === undefined ? [] : ["--module", options.module]),
        ...(options.again === true ? ["--again"] : []),
      ],
      cwd,
      env: { STACKRA_ENVIRONMENT: environment },
    },
    io,
  );
}

/**
 * Stackra file contract:
 * Purpose: `runDbSeed`, the seeding step `stackra db seed` and `stackra seed-pack` share: checks the profile and the
 *          production guard, builds the member (its own `tsdown`, which builds `.stackra/entry/seed.ts`) and runs the
 *          built seed entry with the profile, module, `--again` and who ran it. A member with no root tsdown config
 *          (a service: Encore builds it, so gen writes it no tsdown shim) gets the seed entry alone built into
 *          `.stackra/seed-build/`.
 * Boundary: the CLI loads nothing of the member: the member's own build and Node run its seeders against
 *           `directDatabaseUrl()`. On `production` the `demo` and `test` profiles and `--again` are refused without
 *           `allowProduction`, and every production run prints who ran it; the seed ledger records it too. A member
 *           without a seed entry has no seeders: nothing runs and the answer is 0.
 * Runtime: node
 * Governing contract: ADR 0190 (profiles); ADR 0325 (decision 7); ADR 0282 (decision 3); STA-1709; STA-2840 (a
 *                     service's seed build).
 */
import { existsSync } from "node:fs";
import { userInfo } from "node:os";
import { join } from "node:path";

import { checkSeedGuard } from "#node/functions/check-seed-guard.function";
import { runProcess } from "#node/functions/run-process.function";
import type { CliIo } from "#node/types/cli-io.type";

/** The member-root tsdown configs a plain `tsdown` run finds (gen's shim or an authored one). */
const ROOT_TSDOWN_CONFIGS = [
  "tsdown.config.ts",
  "tsdown.config.mts",
  "tsdown.config.js",
  "tsdown.config.mjs",
] as const;

/** Where a member without a root tsdown config gets its seed entry built. */
const SEED_BUILD = join(".stackra", "seed-build");

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
  const own = ROOT_TSDOWN_CONFIGS.some((file) => existsSync(join(cwd, file)));
  // The entry by absolute path: tsdown reads a relative `.stackra/…` as a glob, which skips dot folders.
  const built = await runProcess(
    own
      ? { command: "tsdown", args: [], cwd }
      : {
          command: "tsdown",
          args: [
            join(cwd, ".stackra", "entry", "seed.ts"),
            "--no-config",
            "--format",
            "esm",
            "--platform",
            "node",
            "--out-dir",
            SEED_BUILD,
          ],
          cwd,
        },
    io,
  );
  if (built !== 0) return built;
  return runProcess(
    {
      command: process.execPath,
      args: [
        join(own ? "dist" : SEED_BUILD, "seed.mjs"),
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

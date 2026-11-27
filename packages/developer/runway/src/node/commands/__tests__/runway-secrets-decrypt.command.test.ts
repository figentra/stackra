/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwaySecretsDecryptCommand` on the console: it decrypts the named scope from `--dir`
 *          (relative to the working folder) with only the `--names` asked for, exports the values into the job's
 *          GITHUB_ENV and prints the names and the count, never a value; it refuses without `--scope` or without
 *          GITHUB_ENV before anything is decrypted; a product scope that lacks a required secret fails with the names
 *          and nothing decrypted, an optional one only warns (STA-258).
 * Boundary: test only; the decrypt, the export and the job's environment are replaced through their fields, so no
 *           sops, Cloud KMS or GitHub file runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525 (CI decrypts in place); ADR 0506 (decision 8).
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwaySecretsDecryptCommand } from "#node/commands/runway-secrets-decrypt.command";

/** The value the fake scope holds; it must never reach the output. */
const VALUE = "s3cr3t-value";

/** The command with its decrypt and export recorded, run in `/work` with `env` as the job's environment. */
async function run(
  argv: readonly string[],
  env: Record<string, string | undefined>,
  check: Awaited<ReturnType<RunwaySecretsDecryptCommand["missing"]>> = null,
) {
  const decrypted: unknown[] = [];
  const exported: unknown[] = [];
  const checked: unknown[] = [];
  class Decrypt extends RunwaySecretsDecryptCommand {
    override env = env;

    override missing = async (input: Parameters<RunwaySecretsDecryptCommand["missing"]>[0]) => {
      checked.push(input);
      return check;
    };

    override decrypt = async (input: Parameters<RunwaySecretsDecryptCommand["decrypt"]>[0]) => {
      decrypted.push(input);
      return new Map([["STACKRA_REGISTRY_TOKEN", VALUE]]);
    };

    override export = (
      values: ReadonlyMap<string, string>,
      options: Parameters<RunwaySecretsDecryptCommand["export"]>[1],
    ) => {
      exported.push(options.envFile);
      return [...values.keys()];
    };
  }
  const result = await runCommandForTest([Decrypt], ["secrets:decrypt", ...argv], { cwd: "/work" });
  return { result, decrypted, exported, checked };
}

describe(RunwaySecretsDecryptCommand, () => {
  /** The scope is read from the folder under the working one, narrowed to the names, and only names are printed. */
  it("decrypts the asked names into GITHUB_ENV and prints no value", async () => {
    const { result, decrypted, exported } = await run(
      ["--scope", "ci/build/registry", "--names", "STACKRA_REGISTRY_TOKEN, "],
      { GITHUB_ENV: "/tmp/github-env" },
    );

    expect(result.exitCode).toBe(0);
    expect(decrypted).toEqual([
      { dir: "/work/.secrets", scope: "ci/build/registry", names: ["STACKRA_REGISTRY_TOKEN"] },
    ]);
    expect(exported).toEqual(["/tmp/github-env"]);
    expect(result.stdout + result.stderr).toContain("1 exported (STACKRA_REGISTRY_TOKEN)");
    expect(result.stdout + result.stderr).not.toContain(VALUE);
  });

  /** Nothing is decrypted without a scope to read or a job environment to write into. */
  it("refuses without --scope or GITHUB_ENV before decrypting", async () => {
    const noScope = await run([], { GITHUB_ENV: "/tmp/github-env" });
    const noJob = await run(["--scope", "ci/deploy"], {});

    expect(noScope.result.exitCode).not.toBe(0);
    expect(noScope.result.stderr).toContain("--scope is required");
    expect(noJob.result.exitCode).not.toBe(0);
    expect(noJob.result.stderr).toContain("no GITHUB_ENV");
    expect([...noScope.decrypted, ...noJob.decrypted]).toEqual([]);
  });

  /** A product scope is checked by name first; a required name it lacks stops the job before any decrypt. */
  it("fails a product scope that lacks a required secret, names only, with nothing decrypted", async () => {
    const { result, decrypted, checked } = await run(
      ["--scope", "products/acme/staging", "--names", "CLOUDFLARE_API_TOKEN"],
      { GITHUB_ENV: "/tmp/github-env" },
      {
        environments: ["staging"],
        findings: [
          {
            level: "error",
            name: "STRIPE_SECRET_KEY",
            where: "services/api",
            message: "is not in products/acme/staging",
          },
          {
            level: "warning",
            name: "SENTRY_DSN",
            where: "services/api",
            message: "is not in products/acme/staging",
          },
        ],
      },
    );

    expect(checked).toEqual([
      { cwd: "/work", scope: "products/acme/staging", dir: "/work/.secrets" },
    ]);
    expect(result.exitCode).toBe(1);
    expect(decrypted).toEqual([]);
    expect(result.stdout + result.stderr).toContain(
      "STRIPE_SECRET_KEY (services/api) is not in products/acme/staging",
    );
    expect(result.stdout + result.stderr).toContain(
      "products/acme/staging: 1 required secret(s) missing for staging; nothing decrypted",
    );
  });

  /** An optional absent name warns and the decrypt goes on. */
  it("decrypts a product scope whose only gap is an optional name", async () => {
    const { result, decrypted } = await run(
      ["--scope", "products/acme/staging"],
      { GITHUB_ENV: "/tmp/github-env" },
      {
        environments: ["staging"],
        findings: [
          { level: "warning", name: "SENTRY_DSN", where: "services/api", message: "is optional" },
        ],
      },
    );

    expect(result.exitCode).toBe(0);
    expect(decrypted).toHaveLength(1);
    expect(result.stdout + result.stderr).toContain("SENTRY_DSN (services/api) is optional");
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayValidateCommand` on the console, for the action store check (STA-2798): a service
 *          whose committed manifest binds the action stores fails validation, one line per environment and field,
 *          while a deployed environment keeps them in memory, and passes once the root's defaults select durable
 *          stores; a service with no manifest is not checked.
 * Boundary: test only; each run builds a throwaway repository in the system temp folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352; ADR 0296 (enforcement); STA-2798.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayValidateCommand } from "#node/commands/runway-validate.command";

/** The root runway, its production services defaulting to `stores` when given. */
const rootYaml = (stores?: string) =>
  [
    "version: 3",
    "project: acme-platform",
    "environments:",
    "  dev: {}",
    "  production:",
    ...(stores === undefined
      ? ["    regions: []"]
      : [
          "    defaults:",
          "      service:",
          "        config:",
          `          actions.stores: ${stores}`,
        ]),
    "",
  ].join("\n");

/** `validate` over a fresh repository with one service, `orders`, whose manifest is `manifest` (none when absent). */
async function run(root: string, manifest?: unknown) {
  const cwd = mkdtempSync(join(tmpdir(), "runway-validate-"));
  writeFileSync(join(cwd, "pnpm-workspace.yaml"), "packages: []\n");
  writeFileSync(join(cwd, "runway.yaml"), root);
  mkdirSync(join(cwd, "services", "orders"), { recursive: true });
  writeFileSync(join(cwd, "services", "orders", "runway.yaml"), "version: 3\nenvironments: {}\n");
  if (manifest !== undefined)
    writeFileSync(
      join(cwd, "services", "orders", "stackra.manifest.json"),
      JSON.stringify(manifest),
    );
  const result = await runCommandForTest([RunwayValidateCommand], ["validate"], { cwd });
  return { exitCode: result.exitCode, output: result.stdout + result.stderr };
}

/** A manifest that binds both action stores. */
const STORES = {
  drivers: [{ key: "actions.IdempotencyStore" }, { key: "actions.RateLimitStore" }],
};

describe(RunwayValidateCommand, () => {
  it("fails a deployed environment that keeps the bound action stores in memory", async () => {
    const { exitCode, output } = await run(rootYaml(), STORES);

    expect(exitCode).toBe(1);
    expect(output).toContain(
      "services/orders/runway.yaml: environments.production.config.actions.stores.idempotency: production keeps actions.IdempotencyStore in memory (the default)",
    );
    expect(output).toContain(
      "services/orders/runway.yaml: environments.production.config.actions.stores.rateLimit: production keeps actions.RateLimitStore in memory (the default)",
    );
  });

  it("passes once the root's defaults select durable stores", async () => {
    const { exitCode, output } = await run(
      rootYaml("{ idempotency: postgres, rateLimit: postgres }"),
      STORES,
    );

    expect(output).not.toContain("actions.stores");
    expect(exitCode).toBe(0);
  });

  it("does not check a service with no manifest", async () => {
    const { output } = await run(rootYaml());

    expect(output).not.toContain("actions.stores");
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `runway validate` on the console. The runtime-only check (STA-2844): a service runway whose
 *          `config` block sets a field an installed package maps to `STACKRA_ENVIRONMENT` fails with the file and the
 *          path, and so does the root's `defaults.service.config`; the same files pass once the field is removed, and a
 *          field nothing maps to the variable stays a value. The action store check (STA-2798): a service whose
 *          committed manifest binds the action stores fails, one line per environment and field, while a deployed
 *          environment keeps them in memory, and passes once the root's defaults select durable stores; a service with
 *          no manifest is not checked, and a runway block that names the stores' environment is refused as runtime-only.
 * Boundary: test only; builds repositories in a temporary folder, with an installed package's manifest under the
 *           member's `node_modules`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352; ADR 0296 (enforcement, and the amendment of 2026-11-26);
 *                     STA-2844; STA-2798.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayValidateCommand } from "#node/commands/runway-validate.command";

/** The root runway, with `defaults` text for staging. */
const root = (defaults = ""): string =>
  [
    "version: 3",
    "project: acme",
    "providers:",
    "  github:",
    "    org: acme",
    "    repo: platform",
    "environments:",
    "  dev:",
    "    destinations:",
    "      services: encore-cloud",
    defaults,
    "",
  ].join("\n");

/** The outbox package's manifest, as gen writes it. */
const OUTBOX_MANIFEST = JSON.stringify({
  package: "@stackra/outbox",
  env: [
    {
      name: "STACKRA_ENVIRONMENT",
      kind: "config",
      type: "string",
      required: false,
      config: "outbox.relay_inbox",
      class: "RelayInboxConfig",
      field: "environment",
    },
  ],
});

/** A repository whose `api` service depends on @stackra/outbox, with `service` as its runway. */
function repository(service: string, rootText = root()): string {
  const folder = mkdtempSync(join(tmpdir(), "runway-validate-"));
  const files: Record<string, string> = {
    "pnpm-workspace.yaml": "packages:\n  - services/*\n",
    "runway.yaml": rootText,
    "services/api/package.json": JSON.stringify({
      name: "@acme/service-api",
      dependencies: { "@stackra/outbox": "1.0.0" },
    }),
    "services/api/node_modules/@stackra/outbox/stackra.manifest.json": OUTBOX_MANIFEST,
    "services/api/runway.yaml": service,
  };
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(folder, path)), { recursive: true });
    writeFileSync(join(folder, path), text);
  }
  return folder;
}

/** Runs `runway validate` in `cwd`. */
const validate = (cwd: string) =>
  runCommandForTest([RunwayValidateCommand], ["validate"], { cwd, requireCommand: true });

describe("runway validate (runtime-only config, STA-2844)", () => {
  it("refuses a service config block that sets the running environment", async () => {
    const cwd = repository(
      [
        "version: 3",
        "environments:",
        "  dev:",
        "    config:",
        "      outbox.relay_inbox:",
        "        environment: dev",
        "",
      ].join("\n"),
    );
    const run = await validate(cwd);
    expect(run.exitCode).toBe(1);
    expect(run.stderr).toContain(
      "services/api/runway.yaml: environments.dev.config.outbox.relay_inbox.environment: is read from STACKRA_ENVIRONMENT",
    );
  });

  it("refuses the root's service defaults that set it", async () => {
    const cwd = repository(
      "version: 3\n",
      root(
        [
          "    defaults:",
          "      service:",
          "        config:",
          "          outbox.relay_inbox:",
          "            environment: dev",
        ].join("\n"),
      ),
    );
    const run = await validate(cwd);
    expect(run.exitCode).toBe(1);
    expect(run.stderr).toContain(
      "runway.yaml: environments.dev.defaults.service.config.outbox.relay_inbox.environment: is read from STACKRA_ENVIRONMENT",
    );
  });

  it("passes once the field is removed, keeping other values", async () => {
    const cwd = repository(
      [
        "version: 3",
        "environments:",
        "  dev:",
        "    config:",
        "      outbox.relay_inbox:",
        "        keys: {}",
        "",
      ].join("\n"),
    );
    const run = await validate(cwd);
    expect(run.stderr).toBe("");
    expect(run.exitCode).toBe(0);
  });
});

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
async function runStores(rootText: string, manifest?: unknown) {
  const cwd = mkdtempSync(join(tmpdir(), "runway-validate-"));
  writeFileSync(join(cwd, "pnpm-workspace.yaml"), "packages: []\n");
  writeFileSync(join(cwd, "runway.yaml"), rootText);
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

describe("runway validate (action stores, STA-2798)", () => {
  it("fails a deployed environment that keeps the bound action stores in memory", async () => {
    const { exitCode, output } = await runStores(rootYaml(), STORES);

    expect(exitCode).toBe(1);
    expect(output).toContain(
      "services/orders/runway.yaml: environments.production.config.actions.stores.idempotency: production keeps actions.IdempotencyStore in memory (the default)",
    );
    expect(output).toContain(
      "services/orders/runway.yaml: environments.production.config.actions.stores.rateLimit: production keeps actions.RateLimitStore in memory (the default)",
    );
  });

  it("passes once the root's defaults select durable stores", async () => {
    const { exitCode, output } = await runStores(
      rootYaml("{ idempotency: postgres, rateLimit: postgres }"),
      STORES,
    );

    expect(output).not.toContain("actions.stores");
    expect(exitCode).toBe(0);
  });

  it("does not check a service with no manifest", async () => {
    const { output } = await runStores(rootYaml());

    expect(output).not.toContain("actions.stores");
  });

  it("refuses a runway block that names the stores' environment, as an installed @stackra/actions maps it (STA-2844)", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "runway-validate-"));
    const files: Record<string, string> = {
      "pnpm-workspace.yaml": "packages:\n  - services/*\n",
      "runway.yaml": rootYaml("{ idempotency: postgres, rateLimit: postgres }"),
      "services/orders/package.json": JSON.stringify({
        name: "@acme/service-orders",
        dependencies: { "@stackra/actions": "1.0.0" },
      }),
      // the env row gen writes for StoresConfig.environment
      "services/orders/node_modules/@stackra/actions/stackra.manifest.json": JSON.stringify({
        package: "@stackra/actions",
        env: [
          {
            name: "STACKRA_ENVIRONMENT",
            kind: "config",
            type: "enum",
            values: ["dev", "test", "preview", "staging", "production"],
            required: false,
            config: "actions.stores",
            class: "StoresConfig",
            field: "environment",
          },
        ],
      }),
      "services/orders/runway.yaml": [
        "version: 3",
        "environments:",
        "  production:",
        "    config:",
        "      actions.stores:",
        "        environment: dev",
        "",
      ].join("\n"),
    };
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(cwd, path)), { recursive: true });
      writeFileSync(join(cwd, path), text);
    }
    const run = await validate(cwd);

    expect(run.exitCode).toBe(1);
    expect(run.stderr).toContain(
      "services/orders/runway.yaml: environments.production.config.actions.stores.environment: is read from STACKRA_ENVIRONMENT",
    );
  });
});

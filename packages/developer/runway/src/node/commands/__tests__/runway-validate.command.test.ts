/**
 * Stackra file contract:
 * Purpose: unit tests of `runway validate`'s runtime-only check (STA-2844): a service runway whose `config` block sets a
 *          field an installed package maps to `STACKRA_ENVIRONMENT` fails with the file and the path, and so does the
 *          root's `defaults.service.config`; the same files pass once the field is removed, and a field nothing maps to
 *          the variable stays a value.
 * Boundary: test only; builds repositories in a temporary folder, with an installed package's manifest under the
 *           member's `node_modules`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352; ADR 0296 (amendment 2026-11-26); STA-2844.
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

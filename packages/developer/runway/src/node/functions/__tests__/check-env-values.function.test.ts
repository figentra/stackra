/**
 * Stackra file contract:
 * Purpose: unit tests of `checkEnvValues`, `envOrphans`, `envValueFailure` and `runway env check --values`: a value
 *          that passes, one missing, one with a refused prefix, a broken type, each read from the job's environment and
 *          placed in the environment's sops scope; orphans are the scope's ciphertext names nothing declares; no
 *          output or error ever holds a value; outside a proved CI job nothing is read.
 * Boundary: test only; builds repositories in a temporary folder, with a plain object for the job's environment.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525; ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { envValueFailure } from "#core/functions/env-value-failure.function";
import { RunwayEnvCheckCommand } from "#node/commands/runway-env-check.command";
import { checkEnvValues } from "#node/functions/check-env-values.function";
import { envOrphans } from "#node/functions/env-orphans.function";

const ROOT = [
  "version: 3",
  "project: acme",
  "providers:",
  "  github:",
  "    org: acme",
  "    repo: platform",
  "environments:",
  "  dev:",
  "    destinations: {}",
  "  staging:",
  "    destinations: {}",
  "  production:",
  "    destinations: {}",
  "",
].join("\n");

const MANIFEST = JSON.stringify({
  member: "api",
  package: "@acme/service-api",
  version: "1.0.0",
  env: [
    { name: "API_ORIGIN", kind: "config", type: "url", required: true },
    {
      name: "STRIPE_SECRET_KEY",
      kind: "secret",
      type: "string",
      required: true,
      refuse: { staging: ["sk_live_"], production: ["sk_test_"] },
    },
  ],
});

const CANARY = "sk_live_CANARY_VALUE_123";

/** A repository with the api service. */
function repository(): string {
  const folder = mkdtempSync(join(tmpdir(), "runway-env-values-"));
  const files = {
    "pnpm-workspace.yaml": "packages:\n  - services/*\n",
    "runway.yaml": ROOT,
    "services/api/runway.yaml": "version: 3\n",
    "services/api/stackra.manifest.json": MANIFEST,
  };
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(folder, path)), { recursive: true });
    writeFileSync(join(folder, path), text);
  }
  return folder;
}

describe("envValueFailure", () => {
  it("names the broken rule, never the value", () => {
    expect(envValueFailure({ name: "A", required: true }, undefined, "dev")).toBe("missing");
    expect(envValueFailure({ name: "A", required: false }, undefined, "dev")).toBeUndefined();
    expect(envValueFailure({ name: "A", type: "url" }, "not-a-url", "dev")).toBe("not a url");
    expect(
      envValueFailure({ name: "A", type: "url" }, "https://api.acme.test", "dev"),
    ).toBeUndefined();
    expect(envValueFailure({ name: "A", type: "enum", values: ["a"] }, "b", "dev")).toBe(
      "not one of the declared values",
    );
    expect(
      envValueFailure({ name: "A", rules: [{ name: "Str", options: { min: 5 } }] }, "abc", "dev"),
    ).toBe("Str min 5");
    expect(
      envValueFailure(
        { name: "A", refuse: { production: ["sk_test_"] } },
        "sk_test_x",
        "production",
      ),
    ).toBe("refused prefix sk_test_ in production");
  });
});

describe("checkEnvValues", () => {
  it("checks the target environment from the job's environment, in its sops scope, and never holds a value", async () => {
    const results = await checkEnvValues({
      root: repository(),
      environment: "staging",
      ci: true,
      env: { API_ORIGIN: "https://api.acme.test", STRIPE_SECRET_KEY: CANARY },
    });
    expect(
      results.map(({ level, environment, name, where, failure }) => [
        level,
        environment,
        name,
        where,
        failure,
      ]),
    ).toEqual([
      ["error", "staging", "API_ORIGIN", "products/acme/staging", undefined],
      [
        "error",
        "staging",
        "STRIPE_SECRET_KEY",
        "products/acme/staging",
        "refused prefix sk_live_ in staging",
      ],
    ]);
    expect(results[0]?.hash).toMatch(/^[0-9a-f]{8}$/);
    expect(JSON.stringify(results)).not.toContain("CANARY");
  });

  it("names a missing value", async () => {
    const results = await checkEnvValues({
      root: repository(),
      environment: "production",
      ci: true,
      env: { API_ORIGIN: "https://api.acme.test" },
    });
    expect(results.map(({ name, where, failure }) => [name, where, failure])).toEqual([
      ["API_ORIGIN", "products/acme/production", undefined],
      ["STRIPE_SECRET_KEY", "products/acme/production", "missing"],
    ]);
  });

  it("refuses outside a proved CI job before reading", async () => {
    await expect(
      checkEnvValues({ root: repository(), environment: "staging", ci: false, env: {} }),
    ).rejects.toThrow(/CI job/);
  });
});

describe("envOrphans", () => {
  it("lists the scope's ciphertext names that nothing declares, decrypting nothing", async () => {
    const root = repository();
    const scope = join(root, ".secrets/products/acme/staging");
    mkdirSync(scope, { recursive: true });
    for (const name of ["API_ORIGIN", "OLD_TOKEN"])
      writeFileSync(join(scope, `${name}.enc.yaml`), "");
    const orphans = await envOrphans({ root, environment: "staging", ci: true });
    expect(orphans).toEqual([{ name: "OLD_TOKEN", where: "products/acme/staging" }]);
    await expect(envOrphans({ root, environment: "dev", ci: true })).rejects.toThrow(
      /no ciphertext for products\/acme\/dev/,
    );
  });
});

describe("runway env check --values", () => {
  it("exits 1 on a target failure and prints names, never a value", async () => {
    const command = class extends RunwayEnvCheckCommand {
      override checkValues: typeof checkEnvValues = (input) =>
        checkEnvValues({ ...input, ci: true, env: { STRIPE_SECRET_KEY: CANARY } });
    };
    const result = await runCommandForTest(
      [command],
      ["env:check", "--values", "--env", "staging"],
      {
        cwd: repository(),
        requireCommand: true,
      },
    );
    expect(result.exitCode, result.stdout + result.stderr).toBe(1);
    expect(result.stdout + result.stderr).toContain("STRIPE_SECRET_KEY");
    expect(result.stdout + result.stderr).not.toContain("CANARY");
  });
});

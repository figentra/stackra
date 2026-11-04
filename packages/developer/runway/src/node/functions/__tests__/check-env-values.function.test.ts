/**
 * Stackra file contract:
 * Purpose: unit tests of `checkEnvValues`, `envOrphans`, `envValueFailure` and `runway env check --values`: a value
 *          that passes, one missing, one with a refused prefix, a broken type; the target environment's failures are
 *          errors and a sibling's are warnings; production is read alone; orphans are the undeclared names; no output
 *          or error ever holds a value; outside a proved CI job nothing is read.
 * Boundary: test only; builds repositories in a temporary folder and answers the Infisical export with a fake runner.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
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
import type { CommandRunner } from "#node/types/command-runner.type";

const ROOT = [
  "version: 3",
  "project: acme",
  "providers:",
  "  github:",
  "    org: acme",
  "    repo: platform",
  "  infisical:",
  "    workspace: proj-1",
  "    environments:",
  "      dev: dev",
  "      staging: staging",
  "      production: prod",
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
    { name: "API_ORIGIN", kind: "config", type: "url", required: true, home: "/runtime/api" },
    {
      name: "STRIPE_SECRET_KEY",
      kind: "secret",
      type: "string",
      required: true,
      refuse: { staging: ["sk_live_"], production: ["sk_test_"] },
      home: "/runtime/api",
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

/** A runner that answers each Infisical environment's export with `folders[slug]`. */
function runner(
  folders: Readonly<Record<string, Record<string, string>>>,
  calls: string[][] = [],
): CommandRunner {
  return async (_program, args) => {
    calls.push([...args]);
    const slug = args[args.indexOf("--env") + 1] ?? "";
    return JSON.stringify(folders[slug] ?? {});
  };
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
  it("errors in the target environment, warns in its siblings, and never holds a value", async () => {
    const calls: string[][] = [];
    const results = await checkEnvValues({
      root: repository(),
      environment: "staging",
      ci: true,
      run: runner(
        {
          staging: { API_ORIGIN: "https://api.acme.test", STRIPE_SECRET_KEY: CANARY },
          dev: { API_ORIGIN: "nope" },
        },
        calls,
      ),
    });
    expect(
      results.map(({ level, environment, name, failure }) => [level, environment, name, failure]),
    ).toEqual([
      ["error", "staging", "API_ORIGIN", undefined],
      ["error", "staging", "STRIPE_SECRET_KEY", "refused prefix sk_live_ in staging"],
      ["warning", "dev", "API_ORIGIN", "not a url"],
      ["warning", "dev", "STRIPE_SECRET_KEY", "missing"],
    ]);
    expect(results[0]?.hash).toMatch(/^[0-9a-f]{8}$/);
    expect(JSON.stringify(results)).not.toContain("CANARY");
    expect(calls.flat()).toContain("proj-1");
    expect(calls.map((args) => args[args.indexOf("--env") + 1])).not.toContain("prod");
  });

  it("reads production alone", async () => {
    const calls: string[][] = [];
    await checkEnvValues({
      root: repository(),
      environment: "production",
      ci: true,
      run: runner({}, calls),
    });
    expect(calls.map((args) => args[args.indexOf("--env") + 1])).toEqual(["prod"]);
  });

  it("refuses outside a proved CI job before reading", async () => {
    const calls: string[][] = [];
    await expect(
      checkEnvValues({
        root: repository(),
        environment: "staging",
        ci: false,
        run: runner({}, calls),
      }),
    ).rejects.toThrow(/CI job/);
    expect(calls).toEqual([]);
  });
});

describe("envOrphans", () => {
  it("lists the names in a home that nothing declares", async () => {
    const orphans = await envOrphans({
      root: repository(),
      environment: "staging",
      ci: true,
      run: runner({ staging: { API_ORIGIN: "x", OLD_TOKEN: CANARY } }),
    });
    expect(orphans).toEqual([{ name: "OLD_TOKEN", where: "staging:/runtime/api" }]);
  });
});

describe("runway env check --values", () => {
  it("exits 1 on a target failure and prints names, never a value", async () => {
    const command = class extends RunwayEnvCheckCommand {
      override checkValues: typeof checkEnvValues = (input) =>
        checkEnvValues({
          ...input,
          ci: true,
          run: runner({ staging: { STRIPE_SECRET_KEY: CANARY } }),
        });
    };
    const result = await runCommandForTest(
      [command],
      ["env:check", "--values", "--env", "staging"],
      {
        cwd: repository(),
        requireCommand: true,
      },
    );
    expect(result.exitCode).toBe(1);
    expect(result.stdout + result.stderr).toContain("STRIPE_SECRET_KEY");
    expect(result.stdout + result.stderr).not.toContain("CANARY");
  });
});

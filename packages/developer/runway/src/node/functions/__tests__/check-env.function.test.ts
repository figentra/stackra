/**
 * Stackra file contract:
 * Purpose: unit tests of `checkEnv` and `runway env check`: a repository whose names all have homes passes; a missing
 *          root `project`, a member secret with no runtime path and a workflow `secret-name` with no `secret-path` are
 *          errors; a raw read of an undeclared name, an export-all step and a deploy secret no code declares are
 *          warnings; platform names, declared names and exempt files are not reported.
 * Boundary: test only; builds repositories in a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayEnvCheckCommand } from "#node/commands/runway-env-check.command";
import { checkEnv } from "#node/functions/check-env.function";

const ROOT = [
  "version: 3",
  "project: acme",
  "providers:",
  "  github:",
  "    org: acme",
  "    repo: platform",
  "  infisical:",
  "    paths:",
  "      runtime: /runtime",
  "secrets:",
  "  defaultPath: runtime",
  "environments:",
  "  staging:",
  "    destinations:",
  "      api: encore-cloud",
  "",
].join("\n");

/** A repository from `files` (path → text). */
function repository(files: Readonly<Record<string, string>>): string {
  const folder = mkdtempSync(join(tmpdir(), "runway-env-"));
  const all = {
    "pnpm-workspace.yaml": "packages:\n  - services/*\n",
    "runway.yaml": ROOT,
    ...files,
  };
  for (const [path, text] of Object.entries(all)) {
    mkdirSync(dirname(join(folder, path)), { recursive: true });
    writeFileSync(join(folder, path), text);
  }
  return folder;
}

const MANIFEST = JSON.stringify({
  member: "api",
  package: "@acme/service-api",
  version: "1.0.0",
  env: [{ name: "STRIPE_SECRET_KEY", kind: "secret", home: "/runtime/api" }],
});

const API = {
  "services/api/runway.yaml": "version: 3\nsecrets: [STRIPE_SECRET_KEY]\n",
  "services/api/stackra.manifest.json": MANIFEST,
};

describe("checkEnv", () => {
  it("passes when every declared name has a home and nothing is read raw", () => {
    const root = repository({
      ...API,
      "services/api/src/boot.ts": "const config = hydrateEnv(ApiConfig, process.env);\n",
      "services/api/src/core/__tests__/a.test.ts": "process.env.UNDECLARED_IN_TEST;\n",
      "services/api/src/api.config.ts": "process.env.UNDECLARED_IN_CONFIG;\n",
      "services/api/src/mode.ts":
        "if (process.env.NODE_ENV === 'test' || import.meta.env.DEV) {}\n",
      "services/api/src/key.ts": "const key = process.env.STRIPE_SECRET_KEY;\n",
    });
    expect(checkEnv(root)).toEqual([]);
  });

  it("refuses a declared name with no home: no project, no runtime path, a step with no secret-path", () => {
    const root = repository({
      ...API,
      "runway.yaml": ROOT.replace("project: acme\n", "").replace(
        "  defaultPath: runtime\n",
        "  ci: []\n",
      ),
      ".github/workflows/deploy.yml":
        "jobs:\n  a:\n    steps:\n      - uses: Infisical/secrets-action@x\n        with:\n          secret-name: EXPO_TOKEN\n",
    });
    const errors = checkEnv(root).filter((finding) => finding.level === "error");
    expect(errors.map((finding) => [finding.name, finding.where])).toEqual([
      ["STRIPE_SECRET_KEY", "services/api/stackra.manifest.json"],
      ["STRIPE_SECRET_KEY", "services/api/runway.yaml"],
      ["EXPO_TOKEN", ".github/workflows/deploy.yml"],
    ]);
  });

  it("warns on a raw undeclared read, an export-all step and a deploy secret no code declares", () => {
    const root = repository({
      "services/api/runway.yaml": "version: 3\nsecrets: [RESEND_API_KEY]\n",
      "services/api/src/a.ts":
        'const a = process.env.STACKRA_LANE; const b = process.env["ACME_KEY"];\n',
      ".github/workflows/ci.yml":
        "jobs:\n  a:\n    steps:\n      - uses: Infisical/secrets-action@x\n        with:\n          secret-path: /ci/turbo\n",
    });
    const findings = checkEnv(root);
    expect(findings.every((finding) => finding.level === "warning")).toBe(true);
    expect(findings.map((finding) => finding.name).toSorted()).toEqual(
      ["/ci/turbo", "ACME_KEY", "RESEND_API_KEY", "STACKRA_LANE"].toSorted(),
    );
  });
});

describe("runway env check", () => {
  it("exits 1 on an error and 0 with warnings only, printing names, never a value", async () => {
    const failing = await runCommandForTest([RunwayEnvCheckCommand], ["env:check"], {
      cwd: repository({ ...API, "runway.yaml": ROOT.replace("project: acme\n", "") }),
      requireCommand: true,
    });
    expect(failing.exitCode).toBe(1);
    expect(failing.stderr + failing.stdout).toContain("STRIPE_SECRET_KEY");
    const passing = await runCommandForTest([RunwayEnvCheckCommand], ["env:check"], {
      cwd: repository(API),
      requireCommand: true,
    });
    expect(passing.exitCode).toBe(0);
  });
});

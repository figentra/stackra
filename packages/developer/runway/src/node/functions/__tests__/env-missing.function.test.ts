/**
 * Stackra file contract:
 * Purpose: unit tests of `envMissing` on a repository and a ciphertext folder: a required synced name the scope lacks
 *          is an error (runway secrets, manifest rows and the gateway's alike), an optional one (`required: false`) is
 *          a warning, a name the scope holds is quiet, a member with no runtime is skipped, names needed only in
 *          another environment are not asked for; it refuses without a project or ciphertext and outside CI. No
 *          value is ever read: the ciphertext files hold canaries the findings never carry.
 * Boundary: test only; builds repositories in a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525; ADR 0371 (amendment 2026-11-27); STA-258.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { envMissing } from "#node/functions/env-missing.function";

const ROOT = (project: string) =>
  [
    "version: 3",
    ...(project === "" ? [] : [`project: ${project}`]),
    "providers:",
    "  github:",
    "    org: acme",
    "    repo: platform",
    "secrets:",
    "  gateway: [GATEWAY_KEY]",
    "environments:",
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
    { name: "STRIPE_SECRET_KEY", kind: "secret", required: true },
    { name: "SENTRY_DSN", kind: "secret", required: false },
    { name: "API_ORIGIN", kind: "config", required: true },
    { name: "PROD_ONLY_KEY", kind: "secret", required: true, environments: ["production"] },
    { name: "VITE_PUBLIC_KEY", kind: "public", required: true },
  ],
});

const CANARY = "canary-value-never-read";

/** A repository with the api service and a docs app, and the staging scope holding `held`. */
function repository(held: readonly string[], project = "acme"): { root: string; dir: string } {
  const root = mkdtempSync(join(tmpdir(), "runway-env-missing-"));
  const files: Record<string, string> = {
    "pnpm-workspace.yaml": "packages:\n  - services/*\n  - apps/*\n",
    "runway.yaml": ROOT(project),
    "services/api/runway.yaml": "version: 3\nsecrets: [MAIL_TOKEN]\n",
    "services/api/stackra.manifest.json": MANIFEST,
    "apps/docs/runway.yaml": "version: 3\nsecrets: [DOCS_ONLY_KEY]\n",
  };
  for (const name of held)
    files[`.secrets/products/acme/staging/${name}.enc.yaml`] = `${name}: ${CANARY}\n`;
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return { root, dir: join(root, ".secrets") };
}

describe(envMissing, () => {
  it("errors on each required synced name the scope lacks and warns on an optional one", async () => {
    const { root, dir } = repository(["API_ORIGIN", "UNRELATED_KEY"]);
    const findings = await envMissing({ root, environment: "staging", dir, ci: true });

    expect(findings.map(({ level, name, where }) => ({ level, name, where }))).toEqual([
      { level: "error", name: "MAIL_TOKEN", where: "services/api" },
      { level: "error", name: "STRIPE_SECRET_KEY", where: "services/api" },
      {
        level: "error",
        name: "GATEWAY_KEY",
        where: "stackra-encore (generated API gateway)",
      },
      { level: "warning", name: "SENTRY_DSN", where: "services/api" },
    ]);
    expect(findings[0]?.message).toContain("is not in products/acme/staging");
    expect(findings.at(-1)?.message).toContain("the sync writes an empty placeholder");
    expect(JSON.stringify(findings)).not.toContain(CANARY);
  });

  it("is quiet when the scope holds every synced name", async () => {
    const { root, dir } = repository([
      "API_ORIGIN",
      "GATEWAY_KEY",
      "MAIL_TOKEN",
      "SENTRY_DSN",
      "STRIPE_SECRET_KEY",
    ]);
    expect(await envMissing({ root, environment: "staging", dir, ci: true })).toEqual([]);
  });

  it("refuses without a project, without the scope's ciphertext, and outside CI", async () => {
    const bare = repository([], "");
    await expect(
      envMissing({ root: bare.root, environment: "staging", dir: bare.dir, ci: true }),
    ).rejects.toThrow(/names no `project`/);
    const { root, dir } = repository([]);
    await expect(envMissing({ root, environment: "production", dir, ci: true })).rejects.toThrow(
      "no ciphertext for products/acme/production: download the scope first",
    );
    await expect(envMissing({ root, environment: "staging", dir, ci: false })).rejects.toThrow(
      /only in a CI job/,
    );
  });
});

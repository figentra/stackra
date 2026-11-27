/**
 * Stackra file contract:
 * Purpose: unit tests of `scopeMissing`: a product scope of the checked-out product runs `envMissing` for every
 *          runway environment of that scope (dev and preview share one) and finds a required name the scope lacks;
 *          any other scope, another product's scope, or a folder with no repository or no runway answers null and
 *          reads nothing. No value is read: the ciphertext files hold canaries the findings never carry.
 * Boundary: test only; builds repositories in a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525; STA-258.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { scopeMissing } from "#node/functions/scope-missing.function";

const CANARY = "canary-value-never-read";

/** A product repository whose api service needs STRIPE_SECRET_KEY, with `held` in its dev and staging scopes. */
function repository(held: readonly string[], runway = true): { root: string; dir: string } {
  const root = mkdtempSync(join(tmpdir(), "runway-scope-missing-"));
  const files: Record<string, string> = {
    "pnpm-workspace.yaml": "packages:\n  - services/*\n",
    "services/api/runway.yaml": "version: 3\nsecrets: [STRIPE_SECRET_KEY]\n",
  };
  if (runway)
    files["runway.yaml"] = [
      "version: 3",
      "project: acme",
      "providers:",
      "  github:",
      "    org: acme",
      "    repo: platform",
      "environments:",
      "  dev:",
      "    destinations: {}",
      "  preview:",
      "    destinations: {}",
      "  staging:",
      "    destinations: {}",
      "",
    ].join("\n");
  for (const scope of ["products/acme/dev", "products/acme/staging"])
    for (const name of held) files[`.secrets/${scope}/${name}.enc.yaml`] = `${name}: ${CANARY}\n`;
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  mkdirSync(join(root, ".secrets/products/acme/dev"), { recursive: true });
  mkdirSync(join(root, ".secrets/products/acme/staging"), { recursive: true });
  return { root, dir: join(root, ".secrets") };
}

describe(scopeMissing, () => {
  it("errors on a required name the checked-out product's scope lacks, for each environment of that scope", async () => {
    const { root, dir } = repository([]);
    const staging = await scopeMissing({
      cwd: join(root, "services/api"),
      scope: "products/acme/staging",
      dir,
      ci: true,
    });
    expect(staging?.environments).toEqual(["staging"]);
    expect(staging?.findings.map(({ level, name, where }) => ({ level, name, where }))).toEqual([
      { level: "error", name: "STRIPE_SECRET_KEY", where: "services/api" },
    ]);
    const dev = await scopeMissing({ cwd: root, scope: "products/acme/dev", dir, ci: true });
    expect(dev?.environments).toEqual(["dev", "preview"]);
    expect(dev?.findings.map(({ name }) => name)).toEqual(["STRIPE_SECRET_KEY"]);
    expect(JSON.stringify([staging, dev])).not.toContain(CANARY);
  });

  it("is quiet when the scope holds every required name", async () => {
    const { root, dir } = repository(["STRIPE_SECRET_KEY"]);
    expect(
      await scopeMissing({ cwd: root, scope: "products/acme/staging", dir, ci: true }),
    ).toEqual({
      environments: ["staging"],
      findings: [],
    });
  });

  it("checks nothing for another scope, another product, no runway or no repository", async () => {
    const { root, dir } = repository([]);
    // ci: false would refuse if anything were read, so a null here proves nothing was.
    for (const scope of ["ci/deploy", "agents", "products/other/staging"])
      expect(await scopeMissing({ cwd: root, scope, dir, ci: false })).toBeNull();
    const bare = repository([], false);
    expect(
      await scopeMissing({
        cwd: bare.root,
        scope: "products/acme/staging",
        dir: bare.dir,
        ci: false,
      }),
    ).toBeNull();
    expect(
      await scopeMissing({ cwd: tmpdir(), scope: "products/acme/staging", dir, ci: false }),
    ).toBeNull();
  });
});

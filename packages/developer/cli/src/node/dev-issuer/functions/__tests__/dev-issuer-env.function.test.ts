/**
 * Stackra file contract:
 * Purpose: unit tests of `devIssuerEnv`: a service gets the dev issuer's public key set and `STACKRA_ENVIRONMENT=dev`
 *          (with no environment set, or `dev`), the same key on every run and never the private key; an app, a package
 *          or a worker gets nothing; a service run where the one environment reader answers anything but `dev` (a test
 *          run, a deployed environment) or refuses the variable (a typo) gets nothing, so it never boots with dev
 *          keys (STA-2844).
 * Boundary: test only; the workspace root is a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (amendment of 2026-11-26: the dev issuer); ADR 0296 (amendment 2026-11-26);
 *                     STA-2795; STA-2844.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { devIssuerKeys } from "@stackra/app/server";
import { StackraEnvironment } from "@stackra/config";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { devIssuerEnv } from "#node/dev-issuer/functions/dev-issuer-env.function";
import { ensureDevIssuer } from "#node/dev-issuer/functions/ensure-dev-issuer.function";

let root = "";
let member = "";

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-dev-issuer-env-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
  member = join(root, "services", "notes");
  mkdirSync(member, { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe(devIssuerEnv, () => {
  it("hands a service the public key set and STACKRA_ENVIRONMENT=dev, which the server accepts", async () => {
    const env = await devIssuerEnv(member, "service", {});
    expect(env["STACKRA_ENVIRONMENT"]).toBe("dev");
    const text = env["STACKRA_DEV_ISSUER_KEYS"] ?? "";
    const { key } = await ensureDevIssuer(root);
    expect(JSON.parse(text)).toEqual({ keys: [key.publicKey] });
    expect(text).not.toContain(String(key.privateKey.d));
    // the server side reads it back as the one public key
    expect(devIssuerKeys({ devKeys: text }, StackraEnvironment.Dev)).toEqual([key.publicKey]);
    expect(await devIssuerEnv(member, "service", { STACKRA_ENVIRONMENT: "dev" })).toEqual(env);
  });

  it("gives nothing outside a service", async () => {
    for (const layout of ["app", "package", "worker", "docs", "tooling"] as const)
      expect(await devIssuerEnv(member, layout, {})).toEqual({});
  });

  it("gives nothing to a service run under another environment, or under a misspelt one", async () => {
    for (const environment of ["test", "preview", "staging", "production", "DEV", "prod"])
      expect(await devIssuerEnv(member, "service", { STACKRA_ENVIRONMENT: environment })).toEqual(
        {},
      );
  });
});

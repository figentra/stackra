/**
 * Stackra file contract:
 * Purpose: unit tests of `devSecretEnv`: a member's run gets the workspace file's values for its own declared secret
 *          names and its runway's dev names only, nothing without the file or a name, and a malformed file fails
 *          naming the file only.
 * Boundary: test only; a temporary workspace.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525 (amendment of 2026-11-10); STA-2679.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { devSecretEnv } from "#node/dev-secrets/functions/dev-secret-env.function";

let root = "";
let member = "";

const env = (name: string, kind = "secret") => ({
  name,
  kind,
  required: true,
  config: "identity",
  class: "IdentityConfig",
  field: "x",
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
  member = join(root, "services", "orders");
  mkdirSync(member, { recursive: true });
  mkdirSync(join(root, ".stackra"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
  writeFileSync(
    join(member, "stackra.manifest.json"),
    JSON.stringify({
      env: [env("SESSION_SECRET"), env("DATABASE_URL"), env("LOG_LEVEL", "config")],
    }),
  );
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("devSecretEnv", () => {
  it("gives the member the values of its own declared secret names", () => {
    writeFileSync(
      join(root, ".stackra", "dev-secrets.json"),
      JSON.stringify({
        SESSION_SECRET: "s",
        DATABASE_URL: "postgres://localhost/orders",
        LOG_LEVEL: "debug",
        OTHER_MEMBERS_KEY: "o",
      }),
    );
    expect(devSecretEnv(member)).toEqual({
      SESSION_SECRET: "s",
      DATABASE_URL: "postgres://localhost/orders",
    });
  });

  it("also gives the names its runway lists under environments.dev.secrets", () => {
    writeFileSync(
      join(member, "runway.yaml"),
      "environments:\n  dev:\n    secrets: [PAY_DATA_KEY]\n",
    );
    writeFileSync(
      join(root, ".stackra", "dev-secrets.json"),
      JSON.stringify({ SESSION_SECRET: "s", PAY_DATA_KEY: "p", OTHER: "o" }),
    );
    expect(devSecretEnv(member)).toEqual({ SESSION_SECRET: "s", PAY_DATA_KEY: "p" });
    rmSync(join(member, "stackra.manifest.json"));
    expect(devSecretEnv(member)).toEqual({ PAY_DATA_KEY: "p" });
  });

  it("adds nothing without the file or without the manifest", () => {
    expect(devSecretEnv(member)).toEqual({});
    writeFileSync(
      join(root, ".stackra", "dev-secrets.json"),
      JSON.stringify({ SESSION_SECRET: "s" }),
    );
    rmSync(join(member, "stackra.manifest.json"));
    expect(devSecretEnv(member)).toEqual({});
  });

  it("fails on a malformed file without quoting it", () => {
    writeFileSync(join(root, ".stackra", "dev-secrets.json"), '{ "SESSION_SECRET": 42 }');
    expect(() => devSecretEnv(member)).toThrow(/must be a JSON object of secret names to strings/);
    writeFileSync(join(root, ".stackra", "dev-secrets.json"), "not-json-value-here");
    expect(() => devSecretEnv(member)).toThrow(/is not valid JSON$/);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `runwayDevSecretNames`: the names a runway lists under `environments.dev.secrets`, and none
 *          without a runway, a dev block or a list.
 * Boundary: test only; a temporary member folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525 (amendment of 2026-11-10); STA-2679.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { runwayDevSecretNames } from "#node/dev-secrets/functions/runway-dev-secret-names.function";

let member = "";

beforeEach(() => {
  member = mkdtempSync(join(tmpdir(), "stackra-cli-"));
});

afterEach(() => {
  rmSync(member, { recursive: true, force: true });
});

describe("runwayDevSecretNames", () => {
  it("lists the names the dev environment asks for", () => {
    writeFileSync(
      join(member, "runway.yaml"),
      "environments:\n  dev:\n    secrets: [PAY_CONNECTIONS_DATA_KEY, CHECKOUT_CLIENT_TOKEN_KEY]\n  production:\n    secrets: [KMS_ONLY]\n",
    );
    expect(runwayDevSecretNames(member)).toEqual([
      "PAY_CONNECTIONS_DATA_KEY",
      "CHECKOUT_CLIENT_TOKEN_KEY",
    ]);
  });

  it("lists none without a runway, a dev block or a list", () => {
    expect(runwayDevSecretNames(member)).toEqual([]);
    writeFileSync(join(member, "runway.yaml"), "environments:\n  production:\n    secrets: [A]\n");
    expect(runwayDevSecretNames(member)).toEqual([]);
    writeFileSync(join(member, "runway.yaml"), "environments:\n  dev:\n    port: 4000\n");
    expect(runwayDevSecretNames(member)).toEqual([]);
  });
});

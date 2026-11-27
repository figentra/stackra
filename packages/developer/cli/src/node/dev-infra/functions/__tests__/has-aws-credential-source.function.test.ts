/**
 * Stackra file contract:
 * Purpose: unit tests of `hasAwsCredentialSource`: no source in an empty environment and home; each source variable,
 *          a shared credentials or config file in the home folder, and the files `AWS_SHARED_CREDENTIALS_FILE` and
 *          `AWS_CONFIG_FILE` name, each count; an empty variable or a named file that is missing does not.
 * Boundary: test only; a temporary home folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 3); STA-2664 (item 6).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { hasAwsCredentialSource } from "#node/dev-infra/functions/has-aws-credential-source.function";

let home = "";

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "stackra-aws-source-"));
});

afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

describe("hasAwsCredentialSource", () => {
  it("finds none in an empty environment and home", () => {
    expect(hasAwsCredentialSource({}, home)).toBe(false);
    expect(hasAwsCredentialSource({ AWS_PROFILE: "", AWS_ACCESS_KEY_ID: "" }, home)).toBe(false);
  });

  it("counts each variable that is a source on its own", () => {
    for (const name of [
      "AWS_ACCESS_KEY_ID",
      "AWS_PROFILE",
      "AWS_WEB_IDENTITY_TOKEN_FILE",
      "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
      "AWS_CONTAINER_CREDENTIALS_FULL_URI",
    ])
      expect(hasAwsCredentialSource({ [name]: "x" }, home)).toBe(true);
  });

  it("counts a shared credentials or config file in the home folder", () => {
    mkdirSync(join(home, ".aws"));
    writeFileSync(join(home, ".aws", "config"), "[default]\n");
    expect(hasAwsCredentialSource({}, home)).toBe(true);
    rmSync(join(home, ".aws", "config"));
    writeFileSync(join(home, ".aws", "credentials"), "[default]\n");
    expect(hasAwsCredentialSource({}, home)).toBe(true);
  });

  it("looks for the files the variables name instead of the home folder's", () => {
    const named = join(home, "elsewhere");
    expect(hasAwsCredentialSource({ AWS_CONFIG_FILE: named }, home)).toBe(false);
    writeFileSync(named, "[default]\n");
    expect(hasAwsCredentialSource({ AWS_CONFIG_FILE: named }, home)).toBe(true);
    expect(hasAwsCredentialSource({ AWS_SHARED_CREDENTIALS_FILE: named }, home)).toBe(true);
  });
});

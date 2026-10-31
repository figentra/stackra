/**
 * Stackra file contract:
 * Purpose: unit tests of `deployPreflight`: a deploy needs a clean tree at the head of origin/main, a promote a commit
 *          on origin/main; otherwise the reason.
 * Boundary: test only; git is a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170; STA-268.
 */
import { describe, expect, it } from "@stackra/testing";

import { deployPreflight } from "#node/functions/deploy-preflight.function";

import { MAIN, OLD, fakeGit } from "./fixtures/deploy-runways.fixture";

describe("deployPreflight", () => {
  it("deploy: a clean tree at the head of origin/main, else the reason", () => {
    const base = {
      "fetch --quiet origin main": "",
      "rev-parse origin/main": MAIN,
      "status --porcelain": "",
      "rev-parse HEAD": MAIN,
    };
    expect(deployPreflight({ command: "deploy", git: fakeGit(base) })).toBe(MAIN);
    expect(() =>
      deployPreflight({
        command: "deploy",
        git: fakeGit({ ...base, "status --porcelain": " M x" }),
      }),
    ).toThrow(/uncommitted changes/);
    expect(() =>
      deployPreflight({ command: "deploy", git: fakeGit({ ...base, "rev-parse HEAD": OLD }) }),
    ).toThrow(/is not the head of origin\/main/);
  });

  it("promote: a commit on origin/main, else the reason", () => {
    const base = {
      "fetch --quiet origin main": "",
      "rev-parse origin/main": MAIN,
      "rev-parse --verify --quiet bbbb^{commit}": OLD,
      [`merge-base --is-ancestor ${OLD} ${MAIN}`]: "",
    };
    expect(deployPreflight({ command: "promote", sha: "bbbb", git: fakeGit(base) })).toBe(OLD);
    expect(() => deployPreflight({ command: "promote", sha: "nope", git: fakeGit(base) })).toThrow(
      /names no commit/,
    );
    expect(() =>
      deployPreflight({
        command: "promote",
        sha: "bbbb",
        git: fakeGit({ ...base, [`merge-base --is-ancestor ${OLD} ${MAIN}`]: new Error("1") }),
      }),
    ).toThrow(/is not on origin\/main/);
  });
});

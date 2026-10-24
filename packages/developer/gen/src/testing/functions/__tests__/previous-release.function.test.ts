/**
 * Stackra file contract:
 * Purpose: unit tests of `previousRelease`: the manifest at the newest release tag of the package, read from git
 *          relative to the member; an empty baseline when the package was never released or the tag predates the
 *          manifest.
 * Boundary: test only; creates a throwaway git repository under `.cache/` with local commits and tags.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 22); ADR 0158.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { previousRelease } from "#testing/functions/previous-release.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

/** Runs git in `cwd` with a fixed identity. */
function git(cwd: string, ...args: string[]): void {
  execFileSync(
    "git",
    [
      "-c",
      "user.name=gen",
      "-c",
      "user.email=gen@example.invalid",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    {
      cwd,
      stdio: "ignore",
    },
  );
}

describe("previousRelease", () => {
  const repo = writeFixtureMember("release-repo", {});
  const member = join(repo, "packages", "loyalty-kit");
  mkdirSync(member, { recursive: true });
  git(repo, "init", "-q");
  writeFileSync(join(member, "package.json"), "{}\n");
  git(repo, "add", ".");
  git(repo, "commit", "-q", "-m", "first");
  git(repo, "tag", "@acme/loyalty-kit@0.1.0");
  writeFileSync(
    join(member, "stackra.manifest.json"),
    JSON.stringify({ member: "loyalty_kit", package: "@acme/loyalty-kit", version: "0.2.0" }),
  );
  git(repo, "add", ".");
  git(repo, "commit", "-q", "-m", "second");
  git(repo, "tag", "@acme/loyalty-kit@0.2.0");
  writeFileSync(
    join(member, "stackra.manifest.json"),
    JSON.stringify({ member: "loyalty_kit", package: "@acme/loyalty-kit", version: "0.3.0-dev" }),
  );

  it("reads the manifest at the newest release tag", async () => {
    expect(await previousRelease("@acme/loyalty-kit", { cwd: member })).toEqual({
      member: "loyalty_kit",
      package: "@acme/loyalty-kit",
      version: "0.2.0",
    });
  });

  it("returns an empty baseline for a package never released", async () => {
    expect(await previousRelease("@acme/unreleased", { cwd: member })).toEqual({
      member: "",
      package: "@acme/unreleased",
      version: "0.0.0",
    });
  });

  it("returns an empty baseline when the tag predates the manifest", async () => {
    git(repo, "tag", "-d", "@acme/loyalty-kit@0.2.0");
    expect((await previousRelease("@acme/loyalty-kit", { cwd: member })).version).toBe("0.0.0");
  });
});

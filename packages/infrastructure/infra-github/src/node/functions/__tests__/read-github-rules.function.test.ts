/**
 * Stackra file contract:
 * Purpose: unit tests of `readGithubRules` over temporary `.github` folders: every ruleset file in name order (other
 *          files skipped) and the branch protection when present; a folder without rules gives none; a file that is
 *          not JSON, or fails its check, fails naming the file.
 * Boundary: test only; writes under the system temporary folder and removes it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 8).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { GithubInfraInvalidError } from "#core/errors/github-infra-invalid.error";
import { readGithubRules } from "#node/functions/read-github-rules.function";

/** A branch ruleset named `name`. */
const ruleset = (name: string) => ({
  name,
  target: "branch",
  enforcement: "active",
  conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } },
  rules: [{ type: "deletion" }],
});

const folders: string[] = [];

/** A fresh `.github` folder holding `files` (path → JSON value or raw text). */
const github = (files: Record<string, unknown>): string => {
  const folder = mkdtempSync(join(tmpdir(), "infra-github-"));
  folders.push(folder);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(folder, path, ".."), { recursive: true });
    writeFileSync(
      join(folder, path),
      typeof content === "string" ? content : JSON.stringify(content),
    );
  }
  return folder;
};

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe("readGithubRules", () => {
  it("reads every ruleset in name order and the branch protection", () => {
    const rules = readGithubRules(
      github({
        "rulesets/main.json": ruleset("main"),
        "rulesets/release-tags.json": { ...ruleset("release-tags"), target: "tag" },
        "rulesets/README.md": "not a ruleset",
        "branch-protection.json": {
          branch: "main",
          rules: {
            required_status_checks: null,
            enforce_admins: true,
            required_pull_request_reviews: null,
            restrictions: null,
          },
        },
      }),
    );

    expect(rules.rulesets.map((entry) => entry.name)).toEqual(["main", "release-tags"]);
    expect(rules.branchProtection?.branch).toBe("main");
  });

  it("gives no rules for a folder without any", () => {
    expect(readGithubRules(github({}))).toEqual({ rulesets: [] });
  });

  it("names the file that is not JSON or fails its check", () => {
    const broken = github({ "rulesets/main.json": "{ not json" });
    expect(() => readGithubRules(broken)).toThrow(GithubInfraInvalidError);
    expect(() => readGithubRules(broken)).toThrow(join(broken, "rulesets", "main.json"));

    const push = github({ "rulesets/main.json": { ...ruleset("main"), target: "push" } });
    expect(() => readGithubRules(push)).toThrow(join(push, "rulesets", "main.json"));
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `committedMigrationDrift`: a member's committed stream has no drift; a changed, staged,
 *          deleted, renamed, untracked or ignored `.sql` file under `.stackra/migrations` is named by its
 *          repository-relative path; other files (a non-SQL file in the stream, a change elsewhere in the repository)
 *          are not; a folder with no `.git` at or above it gets `undefined` (STA-2788).
 * Boundary: test only; temporary git repositories and the real `git`, nothing pushed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 2 as amended); STA-2788.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { committedMigrationDrift } from "#node/functions/committed-migration-drift.function";

let repository: string;

/** The member under test and its stream. */
const MEMBER = "services/billing";
const STREAM = `${MEMBER}/.stackra/migrations`;
const UP = `${STREAM}/0001_plans_0001_create_plans.up.sql`;
const DOWN = `${STREAM}/0001_plans_0001_create_plans.down.sql`;

/** Runs git in the test repository, with a fixed identity and no signing. */
const git = (...args: string[]): string =>
  execFileSync(
    "git",
    [
      "-c",
      "user.name=test",
      "-c",
      "user.email=test@example.com",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    { cwd: repository, encoding: "utf8" },
  );

/** Writes `content` at `path` under the repository, creating its folders. */
function write(path: string, content: string): void {
  const file = join(repository, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

/** The drift of the member. */
const drift = (): readonly string[] | undefined =>
  committedMigrationDrift(join(repository, MEMBER));

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-migration-drift-"));
  git("init", "-q");
  // Stackra's own rules: `.stackra/` is generated, its migrations are committed.
  write(".gitignore", "**/.stackra/*\n!**/.stackra/migrations/\n");
  write(`${MEMBER}/package.json`, "{}\n");
  write(UP, 'create table "plans"."plans" ("id" text primary key);\n');
  write(DOWN, 'drop table "plans"."plans";\n');
  git("add", "--all");
  git("commit", "-q", "-m", "init");
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("committedMigrationDrift", () => {
  it("finds none when the stream is the commit's", () => {
    expect(drift()).toEqual([]);
  });

  it.each([
    ["a changed file", () => write(UP, "drop table plans;\n")],
    [
      "a staged change",
      () => {
        write(UP, "drop table plans;\n");
        git("add", UP);
      },
    ],
    ["a deleted file", () => unlinkSync(join(repository, UP))],
  ])("names %s", (_name, change) => {
    change();
    expect(drift()).toEqual([UP]);
  });

  it("names an untracked file gen wrote", () => {
    write(`${STREAM}/0002_plans_0002_add_status.up.sql`, "alter table plans add status text;\n");
    expect(drift()).toEqual([`${STREAM}/0002_plans_0002_add_status.up.sql`]);
  });

  it("names both paths of a staged rename", () => {
    git("mv", UP, `${STREAM}/0009_plans_0001_create_plans.up.sql`);
    expect(drift()).toEqual([UP, `${STREAM}/0009_plans_0001_create_plans.up.sql`].toSorted());
  });

  /** A product that still ignores `.stackra/` wholesale never committed its stream: every file is drift. */
  it("names an ignored, never committed stream", () => {
    write(".gitignore", "**/.stackra/\n");
    git("rm", "-q", "--cached", "-r", STREAM);
    git("commit", "-q", "-am", "ignore the stream");
    expect(drift()).toEqual([DOWN, UP]);
  });

  it("ignores a non-SQL file in the stream and changes elsewhere", () => {
    write(`${STREAM}/notes.txt`, "scratch\n");
    write(`${MEMBER}/src/index.ts`, "export {};\n");
    write("services/usage/.stackra/migrations/0001_x.up.sql", "select 1;\n");
    expect(drift()).toEqual([]);
  });

  it("gives undefined outside a checkout", () => {
    const folder = mkdtempSync(join(tmpdir(), "stackra-migration-artifact-"));
    try {
      mkdirSync(join(folder, ".stackra", "migrations"), { recursive: true });
      writeFileSync(join(folder, ".stackra", "migrations", "0001_a.up.sql"), "select 1;\n");
      expect(committedMigrationDrift(folder)).toBeUndefined();
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });

  it("throws when a .git is present but git cannot read it", () => {
    rmSync(join(repository, ".git"), { recursive: true, force: true });
    writeFileSync(join(repository, ".git"), "gitdir: /nowhere/at/all\n");
    expect(drift).toThrow(/git cannot read the checkout/);
  });
});

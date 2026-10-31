/**
 * Stackra file contract:
 * Purpose: unit tests of `runRunway`: `plan` prints the plan as JSON, a bad command throws the usage, an unknown target
 *          names the targets, and `--dry-run` prints the commit and the `gh` commands without running gh.
 * Boundary: test only; writes a throwaway repository in the OS temp directory; git and gh are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170; STA-268.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { stringify } from "yaml";

import { runRunway } from "#node/functions/run-runway.function";

import { MAIN, ROOT_RUNWAY, fakeGit } from "./fixtures/deploy-runways.fixture";

let root: string;
let lines: string[];
let ran: string[][];

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-runway-bin-"));
  writeFileSync(join(root, "runway.yaml"), stringify(ROOT_RUNWAY));
  mkdirSync(join(root, ".github/workflows"), { recursive: true });
  writeFileSync(
    join(root, ".github/workflows/deploy-docs.yml"),
    stringify({ on: { workflow_dispatch: { inputs: { sha: {} } } } }),
  );
  lines = [];
  ran = [];
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** The io of a run in the throwaway repository, with `git` answering as given. */
const io = (git = fakeGit({})) => ({
  root,
  git,
  gh: (args: readonly string[]) => void ran.push([...args]),
  log: (line: string) => void lines.push(line),
});

/** A git at a clean head of origin/main. */
const atMain = () =>
  fakeGit({
    "fetch --quiet origin main": "",
    "rev-parse origin/main": MAIN,
    "status --porcelain": "",
    "rev-parse HEAD": MAIN,
  });

describe("runRunway", () => {
  it("prints the production plan as JSON", () => {
    runRunway(["plan"], io());
    expect(JSON.parse(lines.join("\n")).environment).toBe("production");
  });

  it("throws the usage on a bad command and names the targets on an unknown one", () => {
    expect(() => runRunway([], io())).toThrow(/^usage: pnpm runway plan/);
    expect(() => runRunway(["deploy", "nope"], io())).toThrow(
      'runway.yaml has no target "nope" with caller workflows (cloudflare-workers, mintlify, npm)',
    );
  });

  it("prints the commit and the gh commands on --dry-run, and runs nothing", () => {
    runRunway(["deploy", "mintlify", "--dry-run"], io(atMain()));
    expect(lines).toEqual([
      `commit ${MAIN}`,
      `gh workflow run deploy-docs.yml --repo acme/platform --ref main -f sha=${MAIN}`,
    ]);
    expect(ran).toEqual([]);
  });

  it("runs gh without --dry-run and says where to follow the runs", () => {
    runRunway(["deploy", "mintlify"], io(atMain()));
    expect(ran).toHaveLength(1);
    expect(lines.at(-1)).toBe(
      "follow the runs: gh run list --repo acme/platform --event workflow_dispatch",
    );
  });
});

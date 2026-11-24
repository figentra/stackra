/**
 * Stackra file contract:
 * Purpose: unit tests of `readToolsStackPlan`: it reads the root `runway.yaml` of a directory and plans the environment
 *          from it, answering what `toolsStackPlan` answers for the same document; an environment that runs no stack plans
 *          nothing; a missing file, a file that is not YAML and a document that is not a root runway each fail as an
 *          invalid runway naming the file.
 * Boundary: test only; the runways are written to a fresh temporary directory (JSON, which is YAML) and removed after.
 *           Nothing is written outside it and no cloud is called.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0444; ADR 0296 (the root runway); ADR 0171 (decision 3).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseRunway, RunwayInvalidError } from "@stackra/runway";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { toolsStackPlan } from "#core/functions/tools-stack-plan.function";
import { readToolsStackPlan } from "#node/functions/read-tools-stack-plan.function";

const NETWORK = {
  vpcId: "ref:network.gcc.vpc",
  subnetIds: ["subnet-a"],
  securityGroupIds: ["sg-tools"],
};

/** A root runway planning the tools stack in `gcc` for production. */
const ROOT = {
  version: 3,
  project: "acme",
  regions: { gcc: { cloud: "aws", location: "me-central-1", account: "ref:aws.accounts.prod" } },
  providers: {
    tools: { environments: ["production"], extracts: { gcc: "gcc" }, network: { gcc: NETWORK } },
  },
  environments: { staging: { regions: ["gcc"] }, production: { regions: ["gcc"] } },
};

let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "stk-tools-plan-"));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

/** Writes `text` as the directory's root runway. */
function writeRunway(text: string): void {
  writeFileSync(join(directory, "runway.yaml"), text);
}

/** The error `run` throws. */
function failureOf(run: () => unknown): RunwayInvalidError {
  try {
    run();
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error;
    throw error;
  }
  throw new Error("Expected a RunwayInvalidError");
}

describe("readToolsStackPlan", () => {
  it("plans an environment from the directory's root runway, as toolsStackPlan does for the same document", () => {
    writeRunway(JSON.stringify(ROOT));
    const plan = readToolsStackPlan(directory, "production");
    expect(plan).toEqual(toolsStackPlan(parseRunway("root", ROOT), "production"));
    expect(plan.regions.map((region) => region.key)).toEqual(["gcc"]);
  });

  it("plans nothing for an environment that runs no stack", () => {
    writeRunway(JSON.stringify(ROOT));
    expect(readToolsStackPlan(directory, "staging")).toMatchObject({ regions: [] });
  });

  it("fails as an invalid runway, naming the file, when there is no runway.yaml", () => {
    const failure = failureOf(() => readToolsStackPlan(directory, "production"));
    expect(failure.message).toContain(join(directory, "runway.yaml"));
  });

  it("fails as an invalid runway when the file is not YAML", () => {
    writeRunway("regions: [unclosed\n  - : :");
    const failure = failureOf(() => readToolsStackPlan(directory, "production"));
    expect(failure.message).toContain("runway.yaml");
  });

  it("fails as an invalid runway when the document is not a root runway", () => {
    writeRunway(JSON.stringify({ version: 3, project: "acme" }));
    failureOf(() => readToolsStackPlan(directory, "production"));
  });
});

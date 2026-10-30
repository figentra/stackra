/**
 * Stackra file contract:
 * Purpose: unit tests of `MaestroSmokeDriver`: it runs the app's launch check through its command runner and passes
 *          with the report folder as evidence, or fails with the failing command's message.
 * Boundary: test only; a temporary root runway and a fake command runner, so no simulator or Maestro runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-265 spec (D6, FR-011).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { MaestroSmokeDriver } from "#node/drivers/maestro-smoke.driver";

const SUBJECT = {
  target: "mobile",
  name: "shopper",
  platform: "android",
  appPath: "build/shopper.apk",
  templateDir: "template",
} as const;

let repository: string;

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-maestro-smoke-"));
  writeFileSync(
    join(repository, "runway.yaml"),
    JSON.stringify({
      version: 3,
      project: "commerce",
      environments: {},
      mobile: { shopper: { template: "os/mobile@3", identity: { name: { en: "Shopper" } } } },
    }),
  );
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("MaestroSmokeDriver", () => {
  // @covers sta-265:FR-011
  it("runs the launch check and passes with its report folder", async () => {
    const commands: string[] = [];
    const mobile = new MaestroSmokeDriver();
    mobile.run = async (command) => {
      commands.push(command);
      return "";
    };
    await expect(mobile.check(SUBJECT, repository)).resolves.toEqual({
      target: "mobile",
      name: "shopper (android)",
      passed: true,
      problems: [],
      evidence: ".stackra/launch-check/shopper/android",
    });
    expect(commands).toEqual(["adb", "mkdir", "maestro"]);
  });

  // @covers sta-265:FR-011
  it("fails with the failing command's message", async () => {
    const mobile = new MaestroSmokeDriver();
    mobile.run = async (command) => {
      if (command === "maestro") throw new Error("stackra-launch-ready is not visible");
      return "";
    };
    const result = await mobile.check(SUBJECT, repository);
    expect(result.passed).toBe(false);
    expect(result.problems).toEqual(["stackra-launch-ready is not visible"]);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `BrandKitGeneratorDriver`: it runs `brand-kit generate` with the request's folders and
 *          `--json` in the repository, adds `--screenshots` only when given, answers the printed record, and refuses
 *          output that is not a run record.
 * Boundary: test only; the command runner is a fake, nothing runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { BrandKitGeneratorDriver } from "#node/drivers/brand-kit-generator.driver";
import type { CommandRunner } from "#node/types/command-runner.type";

const REQUEST = { kit: "assets/brand", store: "assets/store", out: ".stackra/brand" };
const RECORD = { kit: "mezzora", out: ".stackra/brand", files: ["favicon/site.webmanifest"] };

/** A driver over a fake runner, with the calls it saw. */
function fakeDriver(answer: string) {
  const calls: string[] = [];
  const run: CommandRunner = async (command, args, options) => {
    calls.push(`${options.cwd ?? "."}: ${[command, ...args].join(" ")}`);
    return answer;
  };
  return { driver: new BrandKitGeneratorDriver({ cwd: "/repo", run }), calls };
}

describe("BrandKitGeneratorDriver", () => {
  it("runs the generator and answers its record", async () => {
    const { driver, calls } = fakeDriver(JSON.stringify(RECORD));
    await expect(driver.generate(REQUEST)).resolves.toEqual(RECORD);
    expect(calls).toEqual([
      "/repo: brand-kit generate assets/brand --out .stackra/brand --store assets/store --json",
    ]);
  });

  it("passes the captured screens", async () => {
    const { driver, calls } = fakeDriver(JSON.stringify(RECORD));
    await driver.generate({ ...REQUEST, screenshots: ".stackra/screens" });
    expect(calls[0]).toContain("--screenshots .stackra/screens --json");
  });

  it("refuses output that is not a run record", async () => {
    await expect(fakeDriver("done").driver.generate(REQUEST)).rejects.toThrow("no run record");
    await expect(fakeDriver('{"kit":1}').driver.generate(REQUEST)).rejects.toThrow("no run record");
  });
});

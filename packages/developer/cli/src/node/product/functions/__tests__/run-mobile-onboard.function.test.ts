/**
 * Stackra file contract:
 * Purpose: unit tests of `stackra mobile onboard`: the offline plan of the only app prints every step and the owner's
 *          steps and exits 3 while one is manual; `--app` is needed when the runway has several apps; `--check` and
 *          `--live` refuse to run outside GitHub Actions.
 * Boundary: test only; a temporary product repository, Runway's real `onboardMobile` over the memory drivers, so
 *           nothing leaves the process and nothing is written.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482; spec sta-1623.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { runMobileOnboard } from "#node/product/functions/run-mobile-onboard.function";
import type { CliContext } from "#node/types/cli-context.type";

const RUNWAY = `version: 3
project: academorix
product:
  key: academorix
environments: {}
mobile:
  academorix:
    template: os/mobile@3
    identity:
      name: { en: Academorix }
      ios: { bundleId: app.academorix.mobile, team: figentra }
      android: { package: app.academorix.mobile }
    capabilities: [push]
    eas: { project: ref:expo.projectId, channel: production, owner: academorix }
`;

let folder = "";
let actions: string | undefined;

const run = (values: CliContext["values"]) => {
  const { io, output } = captureIo();
  const code = runMobileOnboard({
    cwd: folder,
    io,
    values,
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output };
};

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), "mobile-onboard-"));
  writeFileSync(join(folder, "runway.yaml"), RUNWAY);
  writeFileSync(join(folder, "mise.toml"), '[tools]\nnode = "24.22.0"\n');
  actions = process.env["GITHUB_ACTIONS"];
  Reflect.deleteProperty(process.env, "GITHUB_ACTIONS");
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
  if (actions !== undefined) process.env["GITHUB_ACTIONS"] = actions;
});

describe("stackra mobile onboard", () => {
  // @covers sta-1623:FR-010
  // @covers sta-1623:FR-001
  it("prints the offline plan of the only app with the owner's steps, writes nothing and exits 3", async () => {
    const { code, output } = run({});

    expect(await code).toBe(3);
    const text = output();
    expect(text).toContain(
      "mobile onboard academorix (offline plan: nothing is called or written)",
    );
    expect(text).toContain("app.academorix.mobile / app.academorix.mobile");
    expect(text).toMatch(/✓ identity\s+done/);
    expect(text).toMatch(
      /→ eas-project\s+planned\s+would create academorix\/academorix-academorix/,
    );
    expect(text).toContain("left for the owner:");
    expect(text).toContain("App Store Connect › Apps › + › New App");
    expect(text).not.toContain("wrote ");
    expect(readFileSync(join(folder, "runway.yaml"), "utf8")).toBe(RUNWAY);
  });

  it("needs --app when the runway has several apps", async () => {
    writeFileSync(join(folder, "runway.yaml"), `${RUNWAY}  kiosk:\n    template: os/mobile@3\n`);

    await expect(run({}).code).rejects.toBeInstanceOf(CliUsageError);
  });

  // @covers sta-1623:FR-005
  it("refuses --check and --live outside GitHub Actions", async () => {
    await expect(run({ live: true }).code).rejects.toBeInstanceOf(CliUsageError);
    await expect(run({ check: true }).code).rejects.toBeInstanceOf(CliUsageError);
  });
});

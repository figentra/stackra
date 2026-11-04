/**
 * Stackra file contract:
 * Purpose: unit tests of `runMobileOnboard`: the offline plan of the only app resolves with every step and the
 *          owner's steps, a manual one among them, and writes nothing; `--app` is needed when the runway has several
 *          apps; `--check` and `--live` refuse to run outside GitHub Actions.
 * Boundary: test only; a temporary product repository, Runway's real `onboardMobile` over the memory drivers, so
 *           nothing leaves the process and nothing is written.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482; spec sta-1623; STA-1966.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { runMobileOnboard } from "#node/product/functions/run-mobile-onboard.function";

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

const run = (values: { app?: string; check?: boolean; live?: boolean }) =>
  runMobileOnboard(folder, { check: false, live: false, ...values });

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
  it("plans the only app offline with the owner's steps and writes nothing", async () => {
    const result = await run({});

    expect(result.app).toBe("academorix");
    expect(result.ids).toMatchObject({
      bundleId: "app.academorix.mobile",
      packageName: "app.academorix.mobile",
    });
    const state = Object.fromEntries(result.steps.map((step) => [step.key, step.state]));
    expect(state["identity"]).toBe("done");
    expect(state["eas-project"]).toBe("planned");
    expect(result.steps.find((step) => step.key === "eas-project")?.detail).toContain(
      "would create academorix/academorix-academorix",
    );
    expect(result.steps.some((step) => step.state === "manual")).toBe(true);
    expect(result.steps.flatMap((step) => step.manual ?? []).join("\n")).toContain(
      "App Store Connect › Apps › + › New App",
    );
    expect(result.written).toEqual([]);
    expect(readFileSync(join(folder, "runway.yaml"), "utf8")).toBe(RUNWAY);
  });

  it("needs --app when the runway has several apps", async () => {
    writeFileSync(join(folder, "runway.yaml"), `${RUNWAY}  kiosk:\n    template: os/mobile@3\n`);

    await expect(run({})).rejects.toBeInstanceOf(CliUsageError);
  });

  // @covers sta-1623:FR-005
  it("refuses --check and --live outside GitHub Actions", async () => {
    await expect(run({ live: true })).rejects.toBeInstanceOf(CliUsageError);
    await expect(run({ check: true })).rejects.toBeInstanceOf(CliUsageError);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `runSmoke`: it resolves with every result and no failure when every subject passed, with
 *          the problems and the failure when one failed, keeps the `--only` targets, passes the mobile build of
 *          `--app`, and refuses an unknown environment or target and a build without `--app` or `--template-dir`.
 * Boundary: test only; a temporary product root and fake drivers, so no browser, simulator or emulator runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-265 spec (FR-013); STA-1966.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { SmokeDriver } from "@stackra/runway";
import type { SmokeResult, SmokeSubject } from "@stackra/runway";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { runSmoke } from "#node/product/functions/run-smoke.function";

const RUNWAY = `version: 3
project: mezzora
product:
  key: mezzora
surfaces:
  console:
    shell: os/console@3
    host: console.mezzora
mobile:
  staff:
    template: os/mobile@3
    identity:
      name: { en: Staff }
environments:
  preview:
    domains: { zone: preview.figentra.com }
    regions: [me-central]
`;

/** A driver that records every subject and fails the names in `failing`. */
class FakeSmokeDriver extends SmokeDriver {
  readonly checked: SmokeSubject[] = [];

  constructor(
    override readonly target: SmokeSubject["target"],
    private readonly failing: readonly string[] = [],
  ) {
    super();
  }

  override async check(subject: SmokeSubject): Promise<SmokeResult> {
    this.checked.push(subject);
    const passed = !this.failing.includes(subject.name);
    return {
      target: subject.target,
      name: subject.name,
      passed,
      problems: passed ? [] : ["page error: boom"],
      evidence: `.stackra/smoke/${subject.name}.png`,
    };
  }
}

let folder = "";

/** Runs `stackra smoke` with `values` over `drivers`. */
function smoke(values: Readonly<Record<string, string>>, drivers: readonly SmokeDriver[]) {
  return runSmoke(folder, values, drivers);
}

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), "stackra-smoke-cli-"));
  writeFileSync(join(folder, "runway.yaml"), RUNWAY);
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

describe("stackra smoke", () => {
  // @covers sta-265:FR-013
  it("resolves with each result and no failure when every subject passed", async () => {
    const web = new FakeSmokeDriver("web");
    const { results, failure } = await smoke({ env: "preview", only: "web" }, [web]);
    expect(failure).toBeUndefined();
    expect(web.checked).toEqual([
      { target: "web", name: "console", url: "https://console.mezzora.preview.figentra.com/" },
    ]);
    expect(results).toEqual([
      {
        target: "web",
        name: "console",
        passed: true,
        problems: [],
        evidence: ".stackra/smoke/console.png",
      },
    ]);
  });

  // @covers sta-265:FR-013
  it("resolves with the problems and the failure when a subject failed", async () => {
    const { results, failure } = await smoke({ env: "preview", only: "web" }, [
      new FakeSmokeDriver("web", ["console"]),
    ]);
    expect(results[0]?.problems).toEqual(["page error: boom"]);
    expect(failure).toContain("Smoke failed: web console");
  });

  // @covers sta-265:FR-013
  it("passes the mobile build of --app and checks only that target", async () => {
    const mobile = new FakeSmokeDriver("mobile");
    const { failure } = await smoke(
      {
        env: "preview",
        only: "mobile",
        app: "staff",
        ios: "build/Staff.app",
        "template-dir": "line",
      },
      [new FakeSmokeDriver("web"), mobile],
    );
    expect(failure).toBeUndefined();
    expect(mobile.checked).toEqual([
      {
        target: "mobile",
        name: "staff",
        platform: "ios",
        appPath: "build/Staff.app",
        templateDir: "line",
      },
    ]);
  });

  it("refuses an unknown environment or target, and a build without --app or --template-dir", async () => {
    await expect(smoke({ env: "nowhere" }, [])).rejects.toThrow(CliUsageError);
    await expect(smoke({ env: "preview", only: "web,tv" }, [])).rejects.toThrow(
      "unknown target tv",
    );
    await expect(smoke({ env: "preview", ios: "build/Staff.app" }, [])).rejects.toThrow(
      "--app <key> and --template-dir",
    );
  });
});

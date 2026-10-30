/**
 * Stackra file contract:
 * Purpose: unit tests of `stackra smoke`: it prints one line per result and exits 0 when every subject passed, exits
 *          1 with the problems when one failed, keeps the `--only` targets, passes the mobile build of `--app`, and
 *          refuses an unknown environment or target and a build without `--app` or `--template-dir`.
 * Boundary: test only; a temporary product root and fake drivers, so no browser, simulator or emulator runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-265 spec (FR-013).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { SmokeDriver } from "@stackra/runway";
import type { SmokeResult, SmokeSubject } from "@stackra/runway";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { runSmoke } from "#node/product/functions/run-smoke.function";
import type { CliContext } from "#node/types/cli-context.type";

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
async function smoke(values: CliContext["values"], drivers: readonly SmokeDriver[]) {
  const { io, output } = captureIo();
  const code = await runSmoke(
    { cwd: folder, io, values, positionals: [], rest: [], cli: async () => 0 },
    drivers,
  );
  return { code, output: output() };
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
  it("prints each result and exits 0 when every subject passed", async () => {
    const web = new FakeSmokeDriver("web");
    const { code, output } = await smoke({ env: "preview", only: "web" }, [web]);
    expect(code).toBe(0);
    expect(web.checked).toEqual([
      { target: "web", name: "console", url: "https://console.mezzora.preview.figentra.com/" },
    ]);
    expect(output).toBe("pass web console (.stackra/smoke/console.png)\nsmoke passed: 1 checked\n");
  });

  // @covers sta-265:FR-013
  it("exits 1 with the problems when a subject failed", async () => {
    const { code, output } = await smoke({ env: "preview", only: "web" }, [
      new FakeSmokeDriver("web", ["console"]),
    ]);
    expect(code).toBe(1);
    expect(output).toContain("FAIL web console (.stackra/smoke/console.png)\n  page error: boom\n");
    expect(output).toContain("Smoke failed: web console\n");
  });

  // @covers sta-265:FR-013
  it("passes the mobile build of --app and checks only that target", async () => {
    const mobile = new FakeSmokeDriver("mobile");
    const { code } = await smoke(
      {
        env: "preview",
        only: "mobile",
        app: "staff",
        ios: "build/Staff.app",
        "template-dir": "line",
      },
      [new FakeSmokeDriver("web"), mobile],
    );
    expect(code).toBe(0);
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

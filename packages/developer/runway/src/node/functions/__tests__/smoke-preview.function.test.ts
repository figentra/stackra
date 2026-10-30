/**
 * Stackra file contract:
 * Purpose: unit tests of `smokePreview`: it checks each web surface but `ops` at its canonical host and each mobile
 *          app on each platform it has a build for, through the driver of its target; it throws
 *          `RunwaySmokeFailedError` with every result when a subject fails or no driver serves its target, and refuses
 *          builds without the template checkout.
 * Boundary: test only; fake drivers record each subject, so no browser, simulator or emulator runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-265 spec (D6, FR-009).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwaySmokeFailedError } from "#core/errors/runway-smoke-failed.error";
import { SmokeDriver } from "#core/ports/smoke-driver.port";
import type { SmokeResult } from "#core/types/smoke-result.type";
import type { SmokeSubject } from "#core/types/smoke-subject.type";
import { PRODUCT_ROOT } from "#node/functions/__tests__/fixtures/product-root.fixture";
import { smokePreview } from "#node/functions/smoke-preview.function";

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
      problems: passed ? [] : ["broken"],
    };
  }
}

let repository: string;

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-smoke-"));
  writeFileSync(
    join(repository, "runway.yaml"),
    JSON.stringify({
      ...PRODUCT_ROOT,
      environments: {
        preview: { domains: { zone: "preview.figentra.com" }, regions: ["me-central"] },
      },
    }),
  );
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("smokePreview", () => {
  // @covers sta-265:FR-009
  it("checks each web surface at its canonical host and each built app platform", async () => {
    const web = new FakeSmokeDriver("web");
    const mobile = new FakeSmokeDriver("mobile");
    const results = await smokePreview({
      repository,
      environment: "preview",
      drivers: [web, mobile],
      builds: { staff: { ios: "build/Staff.app" } },
      templateDir: "template",
    });
    expect(web.checked).toEqual([
      { target: "web", name: "console", url: "https://console.mezzora.preview.figentra.com/" },
      { target: "web", name: "landing", url: "https://mezzora.preview.figentra.com/" },
    ]);
    expect(mobile.checked).toEqual([
      {
        target: "mobile",
        name: "staff",
        platform: "ios",
        appPath: "build/Staff.app",
        templateDir: "template",
      },
    ]);
    expect(results.every((result) => result.passed)).toBe(true);
  });

  // @covers sta-265:FR-009
  it("throws with every result when a subject fails or has no driver", async () => {
    const web = new FakeSmokeDriver("web", ["console"]);
    const failure = await smokePreview({
      repository,
      environment: "preview",
      drivers: [web],
      builds: { staff: { android: "build/staff.apk" } },
      templateDir: "template",
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(RunwaySmokeFailedError);
    const { results, message } = failure as RunwaySmokeFailedError;
    expect(results.map((result) => [result.name, result.passed, result.problems])).toEqual([
      ["console", false, ["broken"]],
      ["landing", true, []],
      ["staff", false, ["no smoke driver for mobile"]],
    ]);
    expect(message).toBe("Smoke failed: web console, mobile staff");
  });

  // @covers sta-265:FR-009
  it("refuses builds without the template checkout", async () => {
    await expect(
      smokePreview({
        repository,
        environment: "preview",
        drivers: [],
        builds: { staff: { ios: "build/Staff.app" } },
      }),
    ).rejects.toThrow(RunwayInvalidError);
  });
});

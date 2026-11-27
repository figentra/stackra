/**
 * Stackra file contract:
 * Purpose: unit tests of `checkServerEnvironment` (STA-1571, STA-2844): a v2 service (authored `src/main.ts`) that
 *          runs `@stackra/app` is refused (`authored_main_environment`), since no generated `environment.ts` would
 *          hand its platform to the reader; a service whose installed `@stackra/app` predates
 *          `providePlatformEnvironment` is refused (`app_version_floor`) at the lower of the floor and gen's own
 *          version; a current app, a package, an app member, a service without `@stackra/app` and a v2 service without
 *          it pass.
 * Boundary: test only; runs on the IR fixtures with a stand-in `@stackra/app` manifest.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0212 (decisions 1 and 4); ADR 0296 (amendment 2026-11-26);
 *                     STA-1571, STA-2844.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { APP_ENVIRONMENT_FLOOR } from "#core/constants/app-environment-floor.constant";
import { checkServerEnvironment } from "#core/functions/check-server-environment.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";
import type { MemberIR } from "#core/types/member-ir.type";

/** The commerce service with `@stackra/app` installed at `version`. */
function served(version: string): MemberIR {
  const manifest = { member: "app", package: "@stackra/app", version } as StackraManifest;
  return {
    ...COMMERCE_IR,
    packages: ["@stackra/app"],
    dependencies: [...COMMERCE_IR.dependencies, { package: "@stackra/app", manifest }],
  };
}

const codes = (ir: MemberIR, generator?: string): string[] =>
  checkServerEnvironment(ir, generator).map((error) => error.code);

describe("checkServerEnvironment", () => {
  it("refuses a v2 service that runs @stackra/app from its authored main", () => {
    const [error] = checkServerEnvironment({ ...served("0.34.0"), authoredMain: true });
    expect(error).toMatchObject({
      code: "authored_main_environment",
      file: "src/main.ts",
      subject: COMMERCE_IR.package,
    });
    expect(error?.fix).toMatch(/delete src\/main\.ts/);
    expect(codes({ ...COMMERCE_IR, packages: ["@stackra/app"], authoredMain: true })).toEqual([
      "authored_main_environment",
    ]);
  });

  it("refuses an @stackra/app older than the floor, naming the version and the floor", () => {
    const [error] = checkServerEnvironment(served("0.33.1"));
    expect(error).toMatchObject({ code: "app_version_floor", subject: "@stackra/app" });
    expect(error?.message).toContain(`0.33.1, older than ${APP_ENVIRONMENT_FLOOR}`);
    expect(codes(served("0.9.9"))).toEqual(["app_version_floor"]);
  });

  it("accepts the floor, a newer app and a pre-release of the floor", () => {
    expect(codes(served(APP_ENVIRONMENT_FLOOR))).toEqual([]);
    expect(codes(served("0.35.2"))).toEqual([]);
    expect(codes(served("1.0.0"))).toEqual([]);
    expect(codes(served("0.34.0-next.1"))).toEqual([]);
  });

  it("never asks for a newer @stackra/app than gen itself", () => {
    expect(codes(served("0.33.1"), "0.33.1")).toEqual([]);
    expect(codes(served("0.33.0"), "0.33.1")).toEqual(["app_version_floor"]);
    expect(codes(served("0.33.1"), "0.34.0")).toEqual(["app_version_floor"]);
    expect(codes(served("0.33.1"), "0.40.0")).toEqual(["app_version_floor"]);
  });

  it("checks no member that does not run @stackra/app as a service", () => {
    expect(codes({ ...COMMERCE_IR, packages: [], authoredMain: true })).toEqual([]);
    expect(codes({ ...COMMERCE_IR, packages: [] })).toEqual([]);
    expect(codes(LOYALTY_KIT_IR)).toEqual([]);
    expect(codes({ ...WEB_APP_IR, packages: ["@stackra/app"] })).toEqual([]);
    // Declared but not installed: there is no manifest version to compare.
    expect(codes({ ...COMMERCE_IR, packages: ["@stackra/app"] })).toEqual([]);
  });
});

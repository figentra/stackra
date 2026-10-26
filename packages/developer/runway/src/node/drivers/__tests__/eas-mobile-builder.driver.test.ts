/**
 * Stackra file contract:
 * Purpose: unit tests of `EasMobileBuilderDriver`: it writes the entry where the template reads it, then starts an
 *          EAS build of the entry's channel for the platforms its identity names and answers the build ids; an entry
 *          without a channel, or without any platform id, is refused before anything is written or run.
 * Boundary: test only; the command runner and the file writer are fakes, nothing runs or is written.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0439 (decisions 1 to 3), ADR 0400 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { AppPublisher } from "#core/enums/app-publisher.enum";
import { MobileBuildTrigger } from "#core/enums/mobile-build-trigger.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { STAFF_APP } from "#core/functions/__tests__/fixtures/product-root.fixture";
import type { MobileBuildRequest } from "#core/types/mobile-build-request.type";
import { EasMobileBuilderDriver } from "#node/drivers/eas-mobile-builder.driver";
import type { CommandRunner } from "#node/types/command-runner.type";

const REQUEST: MobileBuildRequest = {
  product: "mezzora",
  app: "staff",
  entry: STAFF_APP as MobileBuildRequest["entry"],
  trigger: MobileBuildTrigger.ProductMerge,
  sha: "e".repeat(40),
  publisher: AppPublisher.Platform,
};

/** A driver over fake runner and writer, with what each saw. */
function fakeDriver(answer: string) {
  const calls: string[] = [];
  const files = new Map<string, string>();
  const run: CommandRunner = async (command, args, options) => {
    calls.push(`${options.cwd ?? "."}: ${[command, ...args].join(" ")}`);
    return answer;
  };
  const driver = new EasMobileBuilderDriver({
    templateDir: "apps/mobile",
    run,
    write: async (path, text) => {
      files.set(path, text);
    },
  });
  return { driver, calls, files };
}

describe("EasMobileBuilderDriver", () => {
  it("writes the entry and builds the channel for both platforms", async () => {
    const { driver, calls, files } = fakeDriver(JSON.stringify([{ id: "ios-1" }, { id: "and-1" }]));

    const record = await driver.build(REQUEST);

    expect(JSON.parse(files.get("apps/mobile/.stackra/mobile-app.json") ?? "")).toEqual({
      product: "mezzora",
      app: "staff",
      entry: STAFF_APP,
    });
    expect(calls).toEqual([
      "apps/mobile: eas build --profile production --platform all --non-interactive --no-wait --json",
    ]);
    expect(record).toEqual({ app: "staff", reference: "ios-1,and-1" });
  });

  it("builds one platform when the identity names one", async () => {
    const { ios: _ios, ...identity } = STAFF_APP.identity;
    const { driver, calls } = fakeDriver(JSON.stringify({ id: "and-1" }));

    await driver.build({ ...REQUEST, entry: { ...REQUEST.entry, identity } });

    expect(calls[0]).toContain("--platform android");
  });

  it("refuses an entry without a channel or a platform id, writing nothing", async () => {
    const { driver, calls, files } = fakeDriver("[]");
    const noChannel = { ...REQUEST.entry, eas: { project: "p" } };
    const noIds = { ...REQUEST.entry, identity: { name: { en: "Staff" } } };

    await expect(driver.build({ ...REQUEST, entry: noChannel })).rejects.toBeInstanceOf(
      RunwayInvalidError,
    );
    await expect(driver.build({ ...REQUEST, entry: noIds })).rejects.toBeInstanceOf(
      RunwayInvalidError,
    );
    expect(calls).toEqual([]);
    expect(files.size).toBe(0);
  });
});

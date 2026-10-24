/**
 * Stackra file contract:
 * Purpose: unit tests of `DESKTOP_CONFIG_SCHEMA` (`DesktopConfig$`): its defaults equal `DesktopOptions`' initializers,
 *          a nested default can be read and spread the way a generated override does it, and bad values are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0281; ADR 0251.
 */
import { describe, expect, it } from "@stackra/testing";

import { DESKTOP_CONFIG_SCHEMA } from "#core/constants/desktop-config-schema.constant";
import { DesktopOptions } from "#core/schemas/desktop-options.schema";

describe("DESKTOP_CONFIG_SCHEMA", () => {
  it("defaults to DesktopOptions' initializers", () => {
    expect(DESKTOP_CONFIG_SCHEMA.parse({})).toEqual({ ...new DesktopOptions() });
  });

  it("extends a nested field over its default", () => {
    const override = DESKTOP_CONFIG_SCHEMA.extend({
      tray: DESKTOP_CONFIG_SCHEMA.shape.tray.unwrap().default(() => ({
        ...DESKTOP_CONFIG_SCHEMA.shape.tray.parse(undefined),
        enabled: true,
      })),
    });
    expect(override.parse({}).tray).toMatchObject({ enabled: true, onClick: "toggle_main" });
  });

  it("refuses a window set without main, a bad scheme and a staging share above 100", () => {
    expect(DESKTOP_CONFIG_SCHEMA.safeParse({ windows: {} }).success).toBe(false);
    expect(
      DESKTOP_CONFIG_SCHEMA.safeParse({
        deepLinks: { scheme: "Acme Console", claimHttpsOrigin: false, route: "/open" },
      }).success,
    ).toBe(false);
    expect(
      DESKTOP_CONFIG_SCHEMA.safeParse({
        updates: {
          ...DESKTOP_CONFIG_SCHEMA.shape.updates.parse(undefined),
          stagingPercentage: 101,
        },
      }).success,
    ).toBe(false);
  });
});

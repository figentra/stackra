/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DesktopOptions`: a shape registered with its shipped schema, so validation finds
 *          it, with the nested types a host override restates (`BaseDesktopConfig["tray"]`).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0281.
 */
import type { Duration } from "@stackra/contracts";
import type { OfflineStore } from "@stackra/storage";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { DESKTOP_CONFIG_SCHEMA } from "#core/constants/desktop-config-schema.constant";
import type { TrayClickAction } from "#core/enums/tray-click-action.enum";
import { DesktopOptions } from "#core/schemas/desktop-options.schema";

describe("DesktopOptions", () => {
  it("is a shape registered with DesktopConfig$", () => {
    expect(new DesktopOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(DesktopOptions)).toBe(DESKTOP_CONFIG_SCHEMA);
  });

  it("types the nested objects an override restates", () => {
    expectTypeOf<DesktopOptions["tray"]["onClick"]>().toEqualTypeOf<TrayClickAction>();
    expectTypeOf<DesktopOptions["updates"]["checkEvery"]>().toEqualTypeOf<Duration>();
    expectTypeOf<DesktopOptions["offlineStore"]>().toEqualTypeOf<OfflineStore>();
  });
});

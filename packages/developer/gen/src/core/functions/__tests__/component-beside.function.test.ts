/**
 * Stackra file contract:
 * Purpose: unit tests of `componentBeside`: the value export of `<stem>.tsx` on the browser and `<stem>.native.tsx`
 *          on native, in the class's own folder; a type-only export is skipped, and no file means no component.
 * Boundary: test only; runs on the web app IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 14); ADR 0270 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { componentBeside } from "#core/functions/component-beside.function";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("componentBeside", () => {
  const route = "src/routes/order-detail/order-detail.route.ts";

  it("finds the component of each runtime by name", () => {
    expect(
      componentBeside(WEB_APP_IR, "src/routes/settings/settings.route.ts", "settings", "native"),
    ).toEqual({ name: "SettingsScreen", from: "#routes/settings/settings.native" });
    expect(componentBeside(WEB_APP_IR, route, "order-detail", "browser")).toEqual({
      name: "OrderDetailPage",
      from: "#routes/order-detail/order-detail",
    });
  });

  it("finds none where the runtime has no component file", () => {
    expect(componentBeside(WEB_APP_IR, route, "order-detail", "native")).toBeUndefined();
  });
});

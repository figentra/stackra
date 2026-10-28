/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: the template's `WidgetSlot` and the `SavedViewTabs` are exported, and nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#native` alias, with `react-native` and the native kit stubbed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";

vi.mock("react-native", () => ({ View: () => null }));
vi.mock("@stackra/ui/native", () => ({}));

describe("@stackra/panel/native", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(native).sort()).toEqual(["SavedViewTabs", "WidgetSlot"]);
  });
});

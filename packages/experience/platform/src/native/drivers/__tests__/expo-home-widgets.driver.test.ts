/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoHomeWidgetsDriver`: on iOS a publish writes the glance snapshot of the `Glance` widget;
 *          Android and a refused write resolve `unavailable`.
 * Boundary: test only; react-native, expo-widgets and Expo UI are mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (decision 3); STA-1539.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ExpoHomeWidgetsDriver } from "#native/drivers/expo-home-widgets.driver";

const mocks = vi.hoisted(() => ({
  os: { OS: "ios" },
  name: "",
  updateSnapshot: vi.fn(),
}));

vi.mock("react-native", () => ({ Platform: mocks.os }));
vi.mock("@expo/ui/swift-ui", () => ({ Text: () => null, VStack: () => null }));
vi.mock("expo-widgets", () => ({
  createWidget: (name: string) => {
    mocks.name = name;
    return { updateSnapshot: mocks.updateSnapshot };
  },
}));

const GLANCE = { title: "Orders", value: "42", caption: "Today" };

describe("ExpoHomeWidgetsDriver", () => {
  beforeEach(() => {
    mocks.os.OS = "ios";
    vi.clearAllMocks();
  });

  it("writes the snapshot of the Glance widget", async () => {
    expect(await new ExpoHomeWidgetsDriver().publish(GLANCE)).toEqual({
      ok: true,
      data: undefined,
    });
    expect(mocks.name).toBe("Glance");
    expect(mocks.updateSnapshot).toHaveBeenCalledExactlyOnceWith(GLANCE);
  });

  it("refuses on Android and when the write fails", async () => {
    mocks.os.OS = "android";
    expect(await new ExpoHomeWidgetsDriver().publish(GLANCE)).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "home_widget" },
    });
    mocks.os.OS = "ios";
    mocks.updateSnapshot.mockImplementationOnce(() => {
      throw new Error("no app group");
    });
    expect(await new ExpoHomeWidgetsDriver().publish(GLANCE)).toMatchObject({ ok: false });
  });
});

/**
 * Stackra file contract:
 * Purpose: proves the native DataView's icon registry carries every icon name the view draws on its own.
 * Boundary: the Lucide native icons draw through react-native-svg, which does not run in vitest, so they are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement).
 */
import { NATIVE_DATA_VIEW_ICON_NAMES } from "#native/data-view/data-view-icon-names.constant";
import { NATIVE_DATA_VIEW_ICONS } from "#native/data-view/data-view-icons.constant";

vi.mock("@stackra/icons/native/lucide-icons", () => ({
  ArrowDown: () => null,
  ArrowUp: () => null,
  LayoutGrid: () => null,
  List: () => null,
  SlidersHorizontal: () => null,
  X: () => null,
}));

describe("NATIVE_DATA_VIEW_ICONS", () => {
  it("registers every icon the DataView names", () => {
    expect(new Set(Object.keys(NATIVE_DATA_VIEW_ICONS))).toEqual(
      new Set(Object.values(NATIVE_DATA_VIEW_ICON_NAMES)),
    );
  });
});

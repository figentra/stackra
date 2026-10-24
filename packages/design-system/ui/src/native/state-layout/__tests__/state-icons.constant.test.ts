/**
 * Stackra file contract:
 * Purpose: proves the native state registry draws every icon `STATE_ICON` names, so no EmptyState or ErrorState shows
 *          an empty icon well, and holds nothing more than those.
 * Boundary: the native Lucide components need a native runtime, so the module is replaced by stand-ins of the seven
 *           names the registry imports; what is checked is the mapping from name to component.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0313 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-350:FR-150
import { STATE_ICON } from "#core/constants/state-icon.constant";
import { STATE_ICONS } from "#native/state-layout/state-icons.constant";

vi.mock("@stackra/icons/native/lucide-icons", () => ({
  Ban: () => null,
  FileQuestionMark: () => null,
  Inbox: () => null,
  Lock: () => null,
  LogIn: () => null,
  SearchX: () => null,
  TriangleAlert: () => null,
}));

describe("STATE_ICONS (native)", () => {
  it("draws every icon the states name, and only those", () => {
    const names = [...new Set(Object.values(STATE_ICON))].sort();
    expect(Object.keys(STATE_ICONS).sort()).toEqual(names);
    for (const name of names) expect(STATE_ICONS[name], name).toBeDefined();
  });
});

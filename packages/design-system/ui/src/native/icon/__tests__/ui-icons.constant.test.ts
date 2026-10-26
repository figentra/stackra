/**
 * Stackra file contract:
 * Purpose: proves every icon name the native components draw by themselves (the copy mark of a property list, the
 *          chevron of load-more and the sort arrows of a table) is in the package's own registry, so the native
 *          sorted column shows its direction and a copy button its glyph.
 * Boundary: the real registry, with lucide-react-native replaced by one marker per export, because the real icons
 *           need a native runtime; what is proved is the registry's keys.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10); ADR 0313 (decisions 1 and 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-052 sta-350:FR-132 sta-350:FR-142
import { UI_ICONS } from "#native/icon/ui-icons.constant";

const { mark } = vi.hoisted(() => ({ mark: () => null }));

vi.mock("@stackra/icons/native/lucide-icons", () => {
  return {
    ArrowDown: mark,
    ArrowUp: mark,
    Check: mark,
    ChevronDown: mark,
    ChevronLeft: mark,
    ChevronRight: mark,
    CircleAlert: mark,
    CircleCheck: mark,
    Copy: mark,
    Ellipsis: mark,
    ExternalLink: mark,
    Info: mark,
    Sparkles: mark,
    TriangleAlert: mark,
    UserRound: mark,
  };
});

describe("UI_ICONS (native)", () => {
  it.each([
    "copy",
    "check",
    "chevron-down",
    "chevron-left",
    "chevron-right",
    "arrow-up",
    "arrow-down",
  ])("registers %s", (name) => {
    expect(Object.keys(UI_ICONS)).toContain(name);
  });
});

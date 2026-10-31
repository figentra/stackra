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
    ArrowUpDown: mark,
    Bold: mark,
    Code: mark,
    Heading1: mark,
    Heading2: mark,
    Heading3: mark,
    Italic: mark,
    Link: mark,
    List: mark,
    ListOrdered: mark,
    Quote: mark,
    Redo2: mark,
    Strikethrough: mark,
    Underline: mark,
    Undo2: mark,
    Camera: mark,
    ChartColumn: mark,
    Check: mark,
    ChevronDown: mark,
    ChevronLeft: mark,
    ChevronRight: mark,
    CircleAlert: mark,
    CircleCheck: mark,
    Copy: mark,
    Download: mark,
    Ellipsis: mark,
    Eye: mark,
    EyeOff: mark,
    ExternalLink: mark,
    File: mark,
    FileArchive: mark,
    FileImage: mark,
    FileMusic: mark,
    FileSpreadsheet: mark,
    FileText: mark,
    FileVideoCamera: mark,
    GripVertical: mark,
    ChevronsRight: mark,
    Columns3: mark,
    Pin: mark,
    Image: mark,
    ImageOff: mark,
    Images: mark,
    Info: mark,
    Link2: mark,
    Maximize2: mark,
    Minus: mark,
    Pencil: mark,
    Plus: mark,
    RefreshCw: mark,
    RotateCcw: mark,
    Share2: mark,
    SlidersHorizontal: mark,
    Sparkles: mark,
    Table2: mark,
    Trash: mark,
    TriangleAlert: mark,
    Upload: mark,
    UserRound: mark,
    X: mark,
  };
});

describe("UI_ICONS (native)", () => {
  it.each([
    "minus",
    "plus",
    "trash",
    "copy",
    "check",
    "chevron-down",
    "chevron-left",
    "chevron-right",
    "arrow-up",
    "arrow-down",
    "refresh-cw",
    "table-2",
    "chart-column",
    "maximize-2",
  ])("registers %s", (name) => {
    expect(Object.keys(UI_ICONS)).toContain(name);
  });
});

/**
 * Stackra file contract:
 * Purpose: proves the native MessageActions' registry draws the thumbs-up and thumbs-down feedback icons with the
 *          matching Lucide drawings, and holds nothing more.
 * Boundary: the native Lucide components need a native runtime, so the module is replaced by named stand-ins; what is
 *           checked is the mapping from name to component.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0022 (test placement); STA-1371.
 */
import { MESSAGE_ACTIONS_ICONS } from "#native/message-actions/message-actions-icons.constant";

const icons = vi.hoisted(() => ({ ThumbsUp: () => null, ThumbsDown: () => null }));

vi.mock("@stackra/icons/native/lucide-icons", () => icons);

describe("MESSAGE_ACTIONS_ICONS (native)", () => {
  it("maps each feedback icon to its drawing, and only those", () => {
    expect(MESSAGE_ACTIONS_ICONS).toEqual({
      "thumbs-up": icons.ThumbsUp,
      "thumbs-down": icons.ThumbsDown,
    });
  });
});

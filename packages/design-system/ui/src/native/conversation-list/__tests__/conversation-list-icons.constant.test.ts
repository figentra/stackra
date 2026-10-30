/**
 * Stackra file contract:
 * Purpose: proves the native ConversationList's registry draws the empty state's speech bubble and the menu's pin and
 *          unpin icons with the matching Lucide drawings, and holds nothing more.
 * Boundary: the native Lucide components need a native runtime, so the module is replaced by named stand-ins; what is
 *           checked is the mapping from name to component.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0022 (test placement); STA-1371.
 */
import { CONVERSATION_LIST_ICONS } from "#native/conversation-list/conversation-list-icons.constant";

const icons = vi.hoisted(() => ({
  MessageSquare: () => null,
  Pin: () => null,
  PinOff: () => null,
}));

vi.mock("@stackra/icons/native/lucide-icons", () => icons);

describe("CONVERSATION_LIST_ICONS (native)", () => {
  it("maps each icon the list names to its drawing, and only those", () => {
    expect(CONVERSATION_LIST_ICONS).toEqual({
      "message-square": icons.MessageSquare,
      pin: icons.Pin,
      "pin-off": icons.PinOff,
    });
  });
});

/**
 * Stackra file contract:
 * Purpose: the "empty" demo of the web ConversationList: no conversations yet, so the list says where they will
 *          appear.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { ConversationList } from "@stackra/ui/react";

/** A conversation list with no conversations shows its empty state. */
export default function Empty() {
  return (
    <div className="w-full max-w-sm">
      <ConversationList conversations={[]} />
    </div>
  );
}

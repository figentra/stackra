/**
 * Stackra file contract:
 * Purpose: the "roles" demo of the web Overflow list: a staff member's roles in a table cell: one shows, the rest fold, in the accent tone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          design-system gap inventory (2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { OverflowList, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { OVERFLOW_LIST_KEYS } from "#src/demos/free/overflow-list/overflow-list-keys.constant";

/** The demo's keys. */
const K = OVERFLOW_LIST_KEYS.overflow_list.roles;

/** The roles of one cashier. */
const ROLES = ["cashier", "shift_lead", "inventory", "refunds"] as const;

/** Overflow list: Staff roles. */
export default function Roles() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <OverflowList
      label={t(K.label)}
      items={ROLES.map((id) => ({ id, label: t(K[id]) }))}
      maxVisible={1}
      size="md"
      tone="accent"
    />
  );
}

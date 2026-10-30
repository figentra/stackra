/**
 * Stackra file contract:
 * Purpose: the "roles" demo of the native OverflowList: a staff member's roles: one shows in the accent tone, the rest fold.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory (2026-10-28).
 */
import { OverflowList, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { OVERFLOW_LIST_DEMO_KEYS } from "#src/demos/free/overflow-list/overflow-list-demo-keys.constant";

/** The demo's keys. */
const K = OVERFLOW_LIST_DEMO_KEYS.demo_free.overflow_list.roles;

/** The roles of one cashier. */
const ROLES = ["cashier", "shift_lead", "inventory", "refunds"] as const;

/** One role and a "+3 more". */
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

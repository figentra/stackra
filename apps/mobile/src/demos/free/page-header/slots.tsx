/**
 * Stackra file contract:
 * Purpose: the "slots" demo of the native PageHeader: `startContent` leads the title; `endContent` follows the actions.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Avatar, Chip, PageHeader, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_HEADER_DEMO_KEYS } from "#src/demos/free/page-header/page-header-demo-keys.constant";

/** The demo's keys. */
const K = PAGE_HEADER_DEMO_KEYS.demo_free.page_header.slots;

/** An avatar before the name, a chip after it. */
export default function Slots() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <PageHeader
      title="Ada Lovelace"
      description={t(K.body)}
      startContent={<Avatar name="Ada Lovelace" />}
      endContent={<Chip size="sm">{t(K.chip)}</Chip>}
    />
  );
}

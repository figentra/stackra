/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web AttachmentCard: three files on an order (a PDF that opens and downloads, a
 *          spreadsheet, a photo with its thumbnail that can be removed).
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import { AttachmentCard, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ATTACHMENT_CARD_KEYS } from "#src/demos/free/attachment-card/attachment-card-keys.constant";

/** The demo's keys. */
const K = ATTACHMENT_CARD_KEYS.attachment_card.basics;

/** A flat drawing of a shop counter, inline, so the page never touches the network. */
const COUNTER = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#c9d6e3"/><rect x="8" y="34" width="48" height="22" fill="#4a5b6e"/><rect x="14" y="14" width="36" height="14" fill="#f2efe8"/></svg>',
)}`;

/** Three files with open, download and remove actions; the photo shows a preview. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [opened, setOpened] = useState<string | null>(null);
  const [hasPhoto, setHasPhoto] = useState(true);
  return (
    <div className="grid w-full max-w-md gap-2">
      <AttachmentCard
        name={t(K.invoice)}
        type="application/pdf"
        size={2_516_582}
        onOpen={() => setOpened(t(K.invoice))}
        onDownload={() => setOpened(t(K.invoice))}
      />
      <AttachmentCard name={t(K.stock)} size={188_416} onDownload={() => setOpened(t(K.stock))} />
      {hasPhoto ? (
        <AttachmentCard
          name={t(K.counter)}
          type="image/png"
          size={734_003}
          previewSrc={COUNTER}
          onRemove={() => setHasPhoto(false)}
        />
      ) : null}
      {opened ? (
        <Text tone="muted" aria-live="polite">
          {t(K.opened, { name: opened })}
        </Text>
      ) : null}
    </div>
  );
}

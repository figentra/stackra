/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native AttachmentCard: three files on an order (a PDF that opens and downloads, a spreadsheet, a photo with its thumbnail that can be removed).
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import { AttachmentCard, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ATTACHMENT_CARD_DEMO_KEYS } from "#src/demos/free/attachment-card/attachment-card-demo-keys.constant";

/** The demo's keys. */
const K = ATTACHMENT_CARD_DEMO_KEYS.demo_free.attachment_card.basics;

/** A one-pixel slate PNG, so the sample never touches the network; React Native's Image draws no SVG. */
const COUNTER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIKekGAAKjAWRgxqrsAAAAAElFTkSuQmCC";

/** Three files with open, download and remove actions; the photo shows a preview. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [opened, setOpened] = useState<string | null>(null);
  const [hasPhoto, setHasPhoto] = useState(true);
  return (
    <View className="gap-2">
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
      {opened ? <Text tone="muted">{t(K.opened, { name: opened })}</Text> : null}
    </View>
  );
}

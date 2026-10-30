/**
 * Stackra file contract:
 * Purpose: the "upload-states" demo of the web AttachmentCard: one file uploading with its bar, one failed with why and
 *          a retry that starts it uploading again.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import { AttachmentCard, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ATTACHMENT_CARD_KEYS } from "#src/demos/free/attachment-card/attachment-card-keys.constant";

/** The demo's keys. */
const K = ATTACHMENT_CARD_KEYS.attachment_card.upload_states;

/** AttachmentCard: Upload states. */
export default function UploadStates() {
  const t = useCatalogueText(MESSAGES.en);
  const [isRetried, setIsRetried] = useState(false);
  return (
    <div className="grid w-full max-w-md gap-2">
      <AttachmentCard name={t(K.menu)} type="image/jpeg" progress={64} onRemove={() => undefined} />
      {isRetried ? (
        <AttachmentCard name={t(K.contract)} progress={12} onRemove={() => setIsRetried(false)} />
      ) : (
        <AttachmentCard
          name={t(K.contract)}
          error={t(K.error)}
          onRetry={() => setIsRetried(true)}
          onRemove={() => undefined}
        />
      )}
    </div>
  );
}

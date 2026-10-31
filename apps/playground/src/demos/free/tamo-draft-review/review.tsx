/**
 * Stackra file contract:
 * Purpose: the "review" demo of the web tamo-draft-review: Tamo's tidied reply beside the original with Accept, Edit and Discard, and the working and error states.
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { Button, TamoDraftReview, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAMO_DRAFT_REVIEW_KEYS } from "#src/demos/free/tamo-draft-review/tamo-draft-review-keys.constant";

/** The demo's keys. */
const K = TAMO_DRAFT_REVIEW_KEYS.tamo_draft_review;

/** Tamo draft review: review. */
export default function Review() {
  const t = useCatalogueText(MESSAGES.en);
  const [field, setField] = useState(t(K.before));
  const [isOpen, setOpen] = useState(true);
  return (
    <div className="grid max-w-lg gap-4">
      {isOpen ? (
        <TamoDraftReview
          before={field}
          after={t(K.after)}
          onAccept={(text) => {
            setField(text);
            setOpen(false);
          }}
          onDiscard={() => setOpen(false)}
        />
      ) : (
        <Button size="sm" variant="secondary" onPress={() => setOpen(true)}>
          {t(K.again)}
        </Button>
      )}
      <Text type="small" tone="muted">
        <bdi>{t(K.accepted, { text: field })}</bdi>
      </Text>
      <Text type="small" tone="muted">
        {t(K.working)}
      </Text>
      <TamoDraftReview
        before={field}
        after=""
        status="working"
        onAccept={() => undefined}
        onDiscard={() => undefined}
        onStop={() => undefined}
      />
      <Text type="small" tone="muted">
        {t(K.error)}
      </Text>
      <TamoDraftReview
        before={field}
        after=""
        status="error"
        onAccept={() => undefined}
        onDiscard={() => undefined}
        onRetry={() => undefined}
      />
    </div>
  );
}

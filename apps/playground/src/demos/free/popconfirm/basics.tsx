/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Popconfirm: a draft campaign whose delete button asks first, in the danger
 *          tone, and a restore once it is gone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Button, Popconfirm, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { POPCONFIRM_KEYS } from "#src/demos/free/popconfirm/popconfirm-keys.constant";

/** The demo's keys. */
const K = POPCONFIRM_KEYS.popconfirm.basics;

/** Popconfirm: Delete a draft. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [isDeleted, setDeleted] = useState(false);
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4">
      <div className="grid">
        <Text className="font-medium">{t(K.draft)}</Text>
        <Text tone="muted" type="small">
          {isDeleted ? t(K.deleted) : t(K.edited)}
        </Text>
      </div>
      {isDeleted ? (
        <Button variant="secondary" onPress={() => setDeleted(false)}>
          {t(K.restore)}
        </Button>
      ) : (
        <Popconfirm
          trigger={<Button variant="danger-soft">{t(K.trigger)}</Button>}
          title={t(K.title)}
          description={t(K.description)}
          confirmLabel={t(K.confirm)}
          cancelLabel={t(K.cancel)}
          tone="danger"
          onConfirm={() => setDeleted(true)}
        />
      )}
    </div>
  );
}

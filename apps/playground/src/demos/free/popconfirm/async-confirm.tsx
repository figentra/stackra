/**
 * Stackra file contract:
 * Purpose: the "async-confirm" demo of the web Popconfirm: refunding an order, where the confirm waits for the server
 *          with its button pending and the question stays open until the refund is through.
 * Boundary: a demo with no props, @stackra/ui and local state only; the server is a timer. The same file is the preview
 *           and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Button, Popconfirm, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { POPCONFIRM_KEYS } from "#src/demos/free/popconfirm/popconfirm-keys.constant";

/** The demo's keys. */
const K = POPCONFIRM_KEYS.popconfirm.async_confirm;

/** A refund call that takes a moment, as a real one would. */
const refund = () =>
  new Promise<void>((done) => {
    setTimeout(done, 1500);
  });

/** Popconfirm: Wait for the server. */
export default function AsyncConfirm() {
  const t = useCatalogueText(MESSAGES.en);
  const [isRefunded, setRefunded] = useState(false);
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4">
      <div className="grid">
        <Text className="font-medium">{t(K.order)}</Text>
        <Text tone="muted" type="small">
          {isRefunded ? t(K.refunded) : t(K.amount)}
        </Text>
      </div>
      <Popconfirm
        trigger={
          <Button variant="secondary" isDisabled={isRefunded}>
            {t(K.trigger)}
          </Button>
        }
        title={t(K.title)}
        description={t(K.description)}
        confirmLabel={t(K.confirm)}
        placement="bottom"
        onConfirm={() => refund().then(() => setRefunded(true))}
      />
    </div>
  );
}

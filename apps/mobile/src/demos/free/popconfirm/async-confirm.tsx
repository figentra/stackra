/**
 * Stackra file contract:
 * Purpose: the "async-confirm" demo of the native Popconfirm: refunding an order, where the confirm button stays
 *          pending until the server answers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the server is a timer. The same file is the preview
 *           and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Button, Popconfirm, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { POPCONFIRM_DEMO_KEYS } from "#src/demos/free/popconfirm/popconfirm-demo-keys.constant";

/** The demo's keys. */
const K = POPCONFIRM_DEMO_KEYS.demo_free.popconfirm.async_confirm;

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
    <View className="items-start gap-3">
      <Text className="font-medium">{t(K.order)}</Text>
      {isRefunded ? <Text tone="muted">{t(K.refunded)}</Text> : null}
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
    </View>
  );
}

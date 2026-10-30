/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Popconfirm: a draft campaign whose delete button asks first, in the danger
 *          tone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
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
const K = POPCONFIRM_DEMO_KEYS.demo_free.popconfirm.basics;

/** Popconfirm: Delete a draft. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [isDeleted, setDeleted] = useState(false);
  return (
    <View className="items-start gap-3">
      <Text className="font-medium">{t(K.draft)}</Text>
      {isDeleted ? (
        <Text tone="muted">{t(K.deleted)}</Text>
      ) : (
        <Popconfirm
          trigger={<Button variant="danger-soft">{t(K.trigger)}</Button>}
          title={t(K.title)}
          description={t(K.description)}
          confirmLabel={t(K.confirm)}
          cancelLabel={t(K.cancel)}
          tone="danger"
          placement="bottom"
          onConfirm={() => setDeleted(true)}
        />
      )}
    </View>
  );
}

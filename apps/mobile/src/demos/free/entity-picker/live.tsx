/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native EntityPicker: the readout names the chosen record, and `null` once cleared.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { EntityOption } from "@stackra/ui/contracts";
import { EntityPicker, Text, useCatalogueText } from "@stackra/ui/native";
import { useMemo, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ENTITY_PICKER_DEMO_KEYS } from "#src/demos/free/entity-picker/entity-picker-demo-keys.constant";

import { serverOf } from "#src/demos/free/entity-picker/server-of.function";

/** The demo's keys. */
const S = ENTITY_PICKER_DEMO_KEYS.demo_free.entity_picker.shared;
const K = ENTITY_PICKER_DEMO_KEYS.demo_free.entity_picker.live;

/** Choose a person, or press them again to clear. */
export default function Live() {
  const [approver, setApprover] = useState<EntityOption | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const refused = t(S.refused);
  const load = useMemo(() => serverOf(400, { refused }), [refused]);
  return (
    <View className="gap-3">
      <EntityPicker
        label={t(K.label)}
        placeholder={t(S.placeholder)}
        loadOptions={load}
        loadingLabel={t(S.loading)}
        emptyMessage={t(S.empty)}
        value={approver}
        onChange={setApprover}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {approver === null ? t(K.none) : t(K.chosen, { name: approver.label })}
      </Text>
    </View>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "create" demo of the native EntityPicker: `onCreate` with `createLabel` adds the typed record and picks it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { EntityOption } from "@stackra/ui/contracts";
import { EntityPicker, useCatalogueText } from "@stackra/ui/native";
import { useMemo, useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ENTITY_PICKER_DEMO_KEYS } from "#src/demos/free/entity-picker/entity-picker-demo-keys.constant";

import { serverOf } from "#src/demos/free/entity-picker/server-of.function";

/** The demo's keys. */
const S = ENTITY_PICKER_DEMO_KEYS.demo_free.entity_picker.shared;
const K = ENTITY_PICKER_DEMO_KEYS.demo_free.entity_picker.create;

/** A row for the typed text appears when it names no listed record. */
export default function Create() {
  const [member, setMember] = useState<EntityOption | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const refused = t(S.refused);
  const load = useMemo(() => serverOf(400, { refused }), [refused]);
  return (
    <EntityPicker
      label={t(K.label)}
      placeholder={t(S.placeholder)}
      loadOptions={load}
      loadingLabel={t(S.loading)}
      createLabel={(text) => t(K.create_label, { text })}
      onCreate={(text) => ({ id: text.toLocaleLowerCase(), label: text })}
      value={member}
      onChange={setMember}
    />
  );
}

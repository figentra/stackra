/**
 * Stackra file contract:
 * Purpose: the "failing" demo of the native EntityPicker: `loadErrorMessage` replaces the list; typing asks again.
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
const K = ENTITY_PICKER_DEMO_KEYS.demo_free.entity_picker.failing;

/** The pretend server always fails. */
export default function Failing() {
  const [contact, setContact] = useState<EntityOption | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const refused = t(S.refused);
  const failure = t(K.failure);
  const load = useMemo(() => serverOf(400, { refused, failure }), [refused, failure]);
  return (
    <EntityPicker
      label={t(K.label)}
      placeholder={t(S.placeholder)}
      loadOptions={load}
      loadingLabel={t(S.loading)}
      loadErrorMessage={t(S.failed)}
      value={contact}
      onChange={setContact}
    />
  );
}

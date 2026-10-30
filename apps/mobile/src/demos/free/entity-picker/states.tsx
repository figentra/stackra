/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native EntityPicker: required, invalid, disabled and read-only.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { EntityPicker, useCatalogueText } from "@stackra/ui/native";
import { useMemo } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ENTITY_PICKER_DEMO_KEYS } from "#src/demos/free/entity-picker/entity-picker-demo-keys.constant";

import { PEOPLE } from "#src/demos/free/entity-picker/people.constant";
import { serverOf } from "#src/demos/free/entity-picker/server-of.function";

/** The demo's keys. */
const S = ENTITY_PICKER_DEMO_KEYS.demo_free.entity_picker.shared;
const K = ENTITY_PICKER_DEMO_KEYS.demo_free.entity_picker.states;

/** Disabled and read-only keep their record and never open the sheet. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const refused = t(S.refused);
  const load = useMemo(() => serverOf(400, { refused }), [refused]);
  return (
    <View className="gap-4">
      <EntityPicker label={t(K.required)} loadOptions={load} isRequired defaultValue={null} />
      <EntityPicker
        label={t(K.invalid)}
        loadOptions={load}
        isInvalid
        errorMessage={t(K.invalid_error)}
        defaultValue={null}
      />
      <EntityPicker
        label={t(K.disabled)}
        loadOptions={load}
        isDisabled
        defaultValue={PEOPLE[0] ?? null}
      />
      <EntityPicker
        label={t(K.read_only)}
        loadOptions={load}
        isReadOnly
        defaultValue={PEOPLE[1] ?? null}
      />
    </View>
  );
}

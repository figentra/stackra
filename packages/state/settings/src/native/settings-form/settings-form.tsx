/**
 * Stackra file contract:
 * Purpose: `SettingsForm`, the generated settings page on native: one `@stackra/ui/native` field per key of the page
 *          (a switch for a boolean, a text field for a number, a text or a connection id), its label and help from the
 *          declaring module's lang keys, a locked key read-only, and each change written through `SettingsReader` at
 *          the page's scope.
 * Boundary: composition and local state only. The reader comes from the container, so a test swaps it with
 *           `fakeSettings()`; the defaults show until the stored values load, and a failed load keeps them, because a
 *           write still reaches the store, which refuses a locked key. A switch writes at once; a text field writes
 *           when editing ends. A value that breaks its key is not written; a refused write restores the value and
 *           shows why. A connection id is shown, never edited here.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 23 and 24); ADR 0213 (decisions 2 and 8); ADR 0302 (decision 3: native UI from
 *                     @stackra/ui).
 */
import { Switch, TextField } from "@stackra/ui/native";
import type { ReactElement } from "react";
import { View } from "react-native";

import type { SettingsFormProps } from "#native/settings-form/settings-form.props";
import { useSettingsForm } from "#react/settings-form/use-settings-form";

/**
 * The form of one generated settings page.
 *
 * @example
 * <SettingsForm page={SettingsPages.messages} />
 */
export function SettingsForm({ page }: SettingsFormProps): ReactElement {
  const form = useSettingsForm(page);
  return (
    <View className="gap-4">
      {form.fields.map(({ field, shared, isBoolean, isText, checked, text }) =>
        isBoolean ? (
          <Switch
            key={field.path}
            {...shared}
            value={checked}
            onChange={(next) => form.save(field, next)}
          />
        ) : (
          <TextField
            key={field.path}
            {...shared}
            value={text}
            onChange={(next) => form.setDraft(field, next)}
            keyboardType={isText ? "default" : "numeric"}
            onEndEditing={() => form.commit(field)}
          />
        ),
      )}
    </View>
  );
}

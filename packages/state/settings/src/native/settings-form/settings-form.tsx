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
import { useContainer } from "@stackra/container/react";
import { isRefusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { Switch, TextField } from "@stackra/ui/native";
import { type ReactElement, useEffect, useState } from "react";
import { View } from "react-native";

import type { SettingValue } from "#contracts/index";
import { SettingsReader, SettingType } from "#core/index";
import type { SettingKey, SettingsPage, SettingsSnapshot } from "#core/index";
import { isSettingValue } from "#core/functions/is-setting-value.function";
import type { SettingsFormProps } from "#native/settings-form/settings-form.props";

/** The refusals this package's catalogue words; any other failure reads `form.not_saved`. */
const WORDED = new Set(["settings_locked", "setting_value_invalid"]);

/** The message key of a failed write. */
const messageOf = (error: unknown): I18nKey =>
  (isRefusal(error) && WORDED.has(error.code)
    ? `settings::refusals.${error.code}`
    : "settings::form.not_saved") as I18nKey;

/** The message key of a value that breaks its key. */
const INVALID = "settings::refusals.setting_value_invalid" as I18nKey;

/** The defaults of a page, by field name. */
const defaultsOf = (page: SettingsPage): SettingsSnapshot => ({
  values: Object.fromEntries(page.fields.map((field) => [field.name, field.default])),
  locked: [],
});

/** Typed text as a value of `field`: `null` for an empty nullable field, a number for a number key. */
function parse(field: SettingKey, text: string): unknown {
  if (field.type === SettingType.String) return text;
  const trimmed = text.trim();
  if (trimmed === "") return field.nullable === true ? null : undefined;
  return Number(trimmed);
}

/** `record` without `name`. */
function without<V>(record: Readonly<Record<string, V>>, name: string): Record<string, V> {
  const { [name]: _dropped, ...rest } = record;
  return rest;
}

/**
 * The form of one generated settings page.
 *
 * @example
 * <SettingsForm page={SettingsPages.messages} />
 */
export function SettingsForm({ page }: SettingsFormProps): ReactElement {
  const reader = useContainer().get(SettingsReader);
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<SettingsSnapshot>(() => defaultsOf(page));
  const [drafts, setDrafts] = useState<Readonly<Record<string, string>>>({});
  const [errors, setErrors] = useState<Readonly<Record<string, I18nKey>>>({});

  useEffect(() => {
    let live = true;
    reader.read(page).then(
      (next) => {
        if (live) setSnapshot(next);
      },
      // The defaults stay on screen; see the file contract.
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [reader, page]);

  /** Shows `value` and writes it, or marks the field when it breaks its key. */
  const save = (field: SettingKey, value: unknown): void => {
    if (!isSettingValue(field, value)) {
      setErrors((current) => ({ ...current, [field.name]: INVALID }));
      return;
    }
    const previous: SettingValue = snapshot.values[field.name] ?? null;
    const show = (shown: SettingValue) =>
      setSnapshot((current) => ({
        ...current,
        values: { ...current.values, [field.name]: shown },
      }));
    setErrors((current) => without(current, field.name));
    show(value);
    reader.write(page, { [field.name]: value }).catch((error: unknown) => {
      show(previous);
      setErrors((current) => ({ ...current, [field.name]: messageOf(error) }));
    });
  };

  return (
    <View className="gap-4">
      {page.fields.map((field) => {
        const value = snapshot.values[field.name] ?? null;
        const error = errors[field.name];
        const shared = {
          label: t(field.label),
          description: field.help === undefined ? undefined : t(field.help),
          isReadOnly: snapshot.locked.includes(field.name) || field.type === SettingType.Connection,
          isInvalid: error !== undefined,
          errorMessage: error === undefined ? undefined : t(error),
        };
        if (field.type === SettingType.Boolean)
          return (
            <Switch
              key={field.path}
              {...shared}
              value={value === true}
              onChange={(next) => save(field, next)}
            />
          );
        const draft = drafts[field.name];
        const isText = field.type === SettingType.String || field.type === SettingType.Connection;
        return (
          <TextField
            key={field.path}
            {...shared}
            value={draft ?? (value === null ? "" : String(value))}
            keyboardType={isText ? "default" : "numeric"}
            onChange={(text) => setDrafts((current) => ({ ...current, [field.name]: text }))}
            onEndEditing={() => {
              if (draft === undefined) return;
              setDrafts((current) => without(current, field.name));
              save(field, parse(field, draft));
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * Stackra file contract:
 * Purpose: `useSettingsForm(page)`, the state of one generated settings page that the web and native `SettingsForm`
 *          share: the stored values (the defaults until they load), typed drafts, field errors, and the writes through
 *          `SettingsReader` at the page's scope.
 * Boundary: internal; platform-free (no DOM, no React Native), so the native entry imports it. The reader comes from
 *           the container, so a test swaps it with `fakeSettings()`; a failed load keeps the defaults, because a write
 *           still reaches the store, which refuses a locked key. A value that breaks its key is not written; a
 *           refused write restores the value and keeps why on the field.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 23 and 24); ADR 0213 (decisions 2 and 8); ADR 0302 (decision 3).
 */
import { useContainer } from "@stackra/container/react";
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { useEffect, useState } from "react";

import type { SettingValue } from "#contracts/index";
import { SettingsReader, SettingType } from "#core/index";
import type { SettingKey, SettingsPage, SettingsSnapshot } from "#core/index";
import { isSettingValue } from "#core/functions/is-setting-value.function";
import { refusedWriteMessage } from "#react/functions/refused-write-message.function";
import type { SettingsFormState } from "#react/settings-form/settings-form-state.type";

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
 * The state and handlers of one settings page's form.
 *
 * @param page - the page, from the member's generated `SettingsPages`.
 * @example
 * const { fields, save } = useSettingsForm(SettingsPages.messages);
 */
export function useSettingsForm(page: SettingsPage): SettingsFormState {
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
      setErrors((current) => ({ ...current, [field.name]: refusedWriteMessage(error) }));
    });
  };

  const commit = (field: SettingKey): void => {
    const draft = drafts[field.name];
    if (draft === undefined) return;
    setDrafts((current) => without(current, field.name));
    save(field, parse(field, draft));
  };

  const fields = page.fields.map((field) => {
    const value = snapshot.values[field.name] ?? null;
    const error = errors[field.name];
    return {
      field,
      shared: {
        label: t(field.label),
        description: field.help === undefined ? undefined : t(field.help),
        isReadOnly: snapshot.locked.includes(field.name) || field.type === SettingType.Connection,
        isInvalid: error !== undefined,
        errorMessage: error === undefined ? undefined : t(error),
      },
      isBoolean: field.type === SettingType.Boolean,
      isText: field.type === SettingType.String || field.type === SettingType.Connection,
      checked: value === true,
      text: drafts[field.name] ?? (value === null ? "" : String(value)),
    };
  });
  const announced = Object.values(errors).at(-1);

  return {
    fields,
    save,
    setDraft: (field, text) => setDrafts((current) => ({ ...current, [field.name]: text })),
    commit,
    announced: announced === undefined ? "" : t(announced),
  };
}

/**
 * Stackra file contract:
 * Purpose: `SettingsForm`, the generated settings page on the web, at parity with the native one: one
 *          `@stackra/ui/react` field per key of the page (a switch for a boolean, a text field for a number, a text or
 *          a connection id), its label and help from the declaring module's lang keys, a locked key read-only, and
 *          each change written through `SettingsReader` at the page's scope.
 * Boundary: composition and local state only. The reader comes from the container, so a test swaps it with
 *           `fakeSettings()`; the defaults show until the stored values load, and a failed load keeps them, because a
 *           write still reaches the store, which refuses a locked key. A switch writes at once; a text field writes
 *           when it loses focus or on Enter. A value that breaks its key is not written; a refused write restores the
 *           value and shows why under the field and in a polite live region. A connection id is shown, never edited
 *           here. Logical classes only, so the page mirrors in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 23 and 24); ADR 0213 (decisions 2 and 8); ADR 0302 (decision 3: one API on
 *                     web and native); ADR 0165 (UI through @stackra/ui).
 */
import { useContainer } from "@stackra/container/react";
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { Switch, TextField } from "@stackra/ui/react";
import { type ReactElement, useEffect, useState } from "react";

import type { SettingValue } from "#contracts/index";
import { SettingsReader, SettingType } from "#core/index";
import type { SettingKey, SettingsPage, SettingsSnapshot } from "#core/index";
import { isSettingValue } from "#core/functions/is-setting-value.function";
import { refusedWriteMessage } from "#react/functions/refused-write-message.function";
import type { SettingsFormProps } from "#react/settings-form/settings-form.props";

/** The message key of a value that breaks its key. */
const INVALID = "settings::refusals.setting_value_invalid" as I18nKey;

/** The defaults of a page, by field name. */
const defaultsOf = (page: SettingsPage): SettingsSnapshot => ({
  values: Object.fromEntries(page.fields.map((field) => [field.name, field.default])),
  locked: [],
});

/** Typed text as a value of `field`: `null` for an empty nullable field, a number for a number key. */
function parse(field: SettingKey, text: string): unknown {
  if (field.type === SettingType.String || field.type === SettingType.Choice) return text;
  if (field.type === SettingType.List)
    return text.trim() === "" ? [] : text.split(",").map((item) => item.trim());
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
      setErrors((current) => ({ ...current, [field.name]: refusedWriteMessage(error) }));
    });
  };

  /** Writes the field's typed text, if any is pending. */
  const commit = (field: SettingKey): void => {
    const draft = drafts[field.name];
    if (draft === undefined) return;
    setDrafts((current) => without(current, field.name));
    save(field, parse(field, draft));
  };

  const announced = Object.values(errors).at(-1);

  return (
    <div className="flex flex-col gap-4">
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
        const isText = field.type !== SettingType.Integer && field.type !== SettingType.Number;
        return (
          <TextField
            key={field.path}
            {...shared}
            {...(isText ? {} : { inputMode: "decimal" as const })}
            value={
              draft ??
              (value === null ? "" : Array.isArray(value) ? value.join(", ") : String(value))
            }
            onChange={(text) => setDrafts((current) => ({ ...current, [field.name]: text }))}
            onBlur={() => commit(field)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit(field);
            }}
          />
        );
      })}
      <p role="status" aria-live="polite" className="sr-only">
        {announced === undefined ? "" : t(announced)}
      </p>
    </div>
  );
}

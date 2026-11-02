/**
 * Stackra file contract:
 * Purpose: `useSetting(page, name)`, one key of a generated settings page read and written through the container's
 *          `SettingsReader`, the way the settings forms do: the default until the stored value loads, whether a holder
 *          above locks it, and a `set` that writes at the page's level.
 * Boundary: a hook over `SettingsReader#read` and `#write`; it holds no value of its own beyond what is on screen. A
 *           failed read keeps the default (a write still reaches the store, which refuses a locked key). A value that
 *           breaks its key is not written; a refused write restores the previous value and keeps the refusal's
 *           catalogue key in `error`. Web and native share it. Throws outside a `ContainerProvider`, when the
 *           container does not bind the reader, or when `name` is not a key of `page`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 23 and 24); ADR 0213 (decisions 2 and 8); ADR 0294 (decision 17).
 */
import { useContainer } from "@stackra/container/react";
import type { I18nKey } from "@stackra/i18n";
import { useEffect, useState } from "react";

import type { SettingValue } from "#contracts/index";
import { SettingsReader } from "#core/index";
import type { SettingsPage } from "#core/index";
import { isSettingValue } from "#core/functions/is-setting-value.function";
import { refusedWriteMessage } from "#react/functions/refused-write-message.function";
import type { SettingState } from "#react/setting/setting-state.type";

/** The message key of a value that breaks its key. */
const INVALID = "settings::refusals.setting_value_invalid" as I18nKey;

/**
 * One setting of `page`.
 *
 * @throws TypeError when `name` is not a key of `page`.
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `SettingsReader`.
 * @example
 * const marketing = useSetting(SettingsPages.messages, "marketing");
 * <Switch label={t(label)} value={marketing.value === true} onChange={marketing.set} />
 */
export function useSetting(page: SettingsPage, name: string): SettingState {
  const field = page.fields.find((key) => key.name === name);
  if (field === undefined)
    throw new TypeError(`"${name}" is not a key of the "${page.key}" settings page`);
  const reader = useContainer().get(SettingsReader);
  const [value, setValue] = useState<SettingValue>(field.default);
  const [isLocked, setLocked] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [message, setMessage] = useState<I18nKey | undefined>(undefined);

  useEffect(() => {
    let live = true;
    reader
      .read(page)
      .then(
        (snapshot) => {
          if (!live) return;
          setValue(snapshot.values[name] ?? null);
          setLocked(snapshot.locked.includes(name));
        },
        // The default stays on screen; see the file contract.
        () => undefined,
      )
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [reader, page, name]);

  const set = async (next: unknown): Promise<boolean> => {
    if (!isSettingValue(field, next)) {
      setMessage(INVALID);
      return false;
    }
    const previous = value;
    setMessage(undefined);
    setValue(next);
    try {
      await reader.write(page, { [name]: next });
      return true;
    } catch (error: unknown) {
      setValue(previous);
      setMessage(refusedWriteMessage(error));
      return false;
    }
  };

  return { value, isLocked, isLoading, error: message, set };
}

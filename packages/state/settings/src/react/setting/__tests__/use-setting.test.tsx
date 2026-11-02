/**
 * Stackra file contract:
 * Purpose: proves `useSetting` shows a key's default, then the stored value and its lock, writes a value at the
 *          page's scope, refuses one that breaks its key without writing, restores a refused write with the refusal's
 *          catalogue key, and throws for a name that is not a key of the page.
 * Boundary: unit tier, jsdom, a real container that binds the case's reader.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rule 24); ADR 0213 (decisions 2 and 8).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  SettingScope,
  SettingsLockedError,
  SettingsReader,
  SettingType,
  settingKeys,
  settingsPage,
} from "#core/index";
import { useSetting } from "#react/setting/use-setting";
import { fakeSettings } from "#testing/index";

settingKeys({
  alerts: {
    sound: {
      type: SettingType.Boolean,
      default: true,
      scopes: [SettingScope.User],
      label: "alerts::settings.sound.label" as I18nKey,
    },
    volume: {
      type: SettingType.Integer,
      default: 5,
      min: 0,
      max: 10,
      scopes: [SettingScope.User],
      label: "alerts::settings.volume.label" as I18nKey,
    },
  },
});
const PAGE = settingsPage("alerts", { scope: SettingScope.User });

/** A wrapper whose container binds `reader`. */
async function wrapperOver(reader: object) {
  const container = await Container.create([], {
    overrides: new Map([[SettingsReader, reader]]),
  });
  return ({ children }: { readonly children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
}

describe("useSetting", () => {
  it("shows the default, then the stored value and its lock", async () => {
    const wrapper = await wrapperOver({
      read: async () => ({ values: { sound: false, volume: 3 }, locked: ["volume"] }),
      write: async () => undefined,
    });
    const { result } = renderHook(() => useSetting(PAGE, "volume"), { wrapper });
    expect(result.current.value).toBe(5);
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.value).toBe(3);
    expect(result.current.isLocked).toBe(true);
  });

  it("writes a value at the page's scope and refuses one that breaks its key", async () => {
    const settings = fakeSettings();
    const wrapper = await wrapperOver(settings);
    const { result } = renderHook(() => useSetting(PAGE, "volume"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let stored = true;
    await act(async () => {
      stored = await result.current.set(11);
    });
    expect(stored).toBe(false);
    expect(result.current.error).toBe("settings::refusals.setting_value_invalid");
    expect(settings.writes).toEqual([]);
    await act(async () => {
      stored = await result.current.set(7);
    });
    expect(stored).toBe(true);
    expect(result.current.value).toBe(7);
    expect(result.current.error).toBeUndefined();
    expect(settings.writes).toEqual([
      { page: PAGE, scope: SettingScope.User, values: { volume: 7 } },
    ]);
  });

  it("restores a refused write with the refusal's key", async () => {
    const wrapper = await wrapperOver({
      read: async () => ({ values: { sound: true, volume: 5 }, locked: [] }),
      write: async () => {
        throw SettingsLockedError.create({ paths: ["sound"] });
      },
    });
    const { result } = renderHook(() => useSetting(PAGE, "sound"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.set(false);
    });
    expect(result.current.value).toBe(true);
    expect(result.current.error).toBe("settings::refusals.settings_locked");
  });

  it("throws for a name that is not a key of the page", async () => {
    const wrapper = await wrapperOver(fakeSettings());
    expect(() => renderHook(() => useSetting(PAGE, "missing"), { wrapper })).toThrow(TypeError);
  });
});

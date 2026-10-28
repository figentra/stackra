/**
 * Stackra file contract:
 * Purpose: unit tests of `useLanguageSwitcher()` and `<LanguageSwitcher />`: under `system` choosing opens the phone's
 *          settings and stores nothing; Android below 13 runs `in_app`; under `in_app` a same-direction change only
 *          calls `setLocale`, a change across right-to-left also flips the layout and reloads, choosing the active
 *          locale does nothing; the component hands its render function the same state.
 * Boundary: test only; renders with react-dom/server, and `react-native` is a recording stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080 (2026-10-29 note).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";
import { vi } from "vitest";

import { I18nConfig } from "#config/i18n.config";
import { Locale } from "#core/enums/locale.enum";
import { NativeSwitcher } from "#core/enums/native-switcher.enum";
import { LanguageSwitcher } from "#native/language-switcher/language-switcher";
import type { LanguageSwitcherState } from "#native/language-switcher/language-switcher-state.type";
import { useLanguageSwitcher } from "#native/language-switcher/use-language-switcher";
import { I18nProvider } from "#react/i18n-provider/i18n-provider";

const rn = vi.hoisted(() => ({
  Platform: { OS: "ios", Version: "18.0" as string | number },
  Linking: { openSettings: vi.fn(async () => undefined) },
  I18nManager: { isRTL: false, allowRTL: vi.fn(), forceRTL: vi.fn() },
}));

vi.mock("react-native", () => rn);

class SystemConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Fr, Locale.Ar];
}

class InAppConfig extends SystemConfig {
  override nativeSwitcher: NativeSwitcher = NativeSwitcher.InApp;
}

/** Hands the hook's state to the test. */
function Probe({
  reload,
  onState,
}: {
  readonly reload?: () => Promise<void>;
  readonly onState: (state: LanguageSwitcherState) => void;
}) {
  onState(useLanguageSwitcher({ reload }));
  return null;
}

/** The switcher under config `type`, with the locales `setLocale` was called with and the reloads. */
async function switcher(type: typeof I18nConfig) {
  const container = await Container.create(
    [{ member: "mobile", config: [{ key: "i18n", provide: I18nConfig, override: type }] }],
    { overrides: new Map([[I18nConfig, buildConfig(type)]]) },
  );
  const chosen: Locale[] = [];
  const reloads: string[] = [];
  const states: LanguageSwitcherState[] = [];
  renderToString(
    <ContainerProvider container={container}>
      <I18nProvider
        locale={Locale.En}
        messages={{}}
        setLocale={async (locale) => {
          chosen.push(locale);
        }}
      >
        <Probe
          reload={async () => {
            reloads.push("reload");
          }}
          onState={(state) => states.push(state)}
        />
      </I18nProvider>
    </ContainerProvider>,
  );
  const [state] = states;
  if (state === undefined) throw new Error("Probe did not render");
  return { state, chosen, reloads };
}

beforeEach(() => {
  rn.Platform.OS = "ios";
  rn.Platform.Version = "18.0";
  rn.I18nManager.isRTL = false;
  vi.clearAllMocks();
});

describe("useLanguageSwitcher", () => {
  it("opens the phone's settings under system and stores nothing", async () => {
    const { state, chosen } = await switcher(SystemConfig);
    expect(state.mode).toBe("system");
    expect(state.locales).toEqual(["en", "fr", "ar"]);
    expect(state.endonym(Locale.Fr)).toBe("Français");
    await state.choose(Locale.Fr);
    expect(rn.Linking.openSettings).toHaveBeenCalledTimes(1);
    expect(chosen).toEqual([]);
  });

  it("runs in_app below Android 13", async () => {
    rn.Platform.OS = "android";
    rn.Platform.Version = 32;
    const { state, chosen } = await switcher(SystemConfig);
    expect(state.mode).toBe("in_app");
    await state.choose(Locale.Fr);
    expect(chosen).toEqual(["fr"]);
    expect(rn.Linking.openSettings).not.toHaveBeenCalled();
  });

  it("switches in place under in_app without a reload in the same direction", async () => {
    const { state, chosen, reloads } = await switcher(InAppConfig);
    await state.choose(Locale.Fr);
    expect(chosen).toEqual(["fr"]);
    expect(rn.I18nManager.forceRTL).not.toHaveBeenCalled();
    expect(reloads).toEqual([]);
  });

  it("flips the layout and reloads across right-to-left", async () => {
    const { state, chosen, reloads } = await switcher(InAppConfig);
    await state.choose(Locale.Ar);
    expect(chosen).toEqual(["ar"]);
    expect(rn.I18nManager.allowRTL).toHaveBeenCalledWith(true);
    expect(rn.I18nManager.forceRTL).toHaveBeenCalledWith(true);
    expect(reloads).toEqual(["reload"]);
  });

  it("does nothing when the active locale is chosen", async () => {
    const { state, chosen } = await switcher(InAppConfig);
    await state.choose(Locale.En);
    expect(chosen).toEqual([]);
  });
});

describe("LanguageSwitcher", () => {
  it("hands its render function the switcher", async () => {
    const container = await Container.create(
      [{ member: "mobile", config: [{ key: "i18n", provide: I18nConfig, override: InAppConfig }] }],
      { overrides: new Map([[I18nConfig, buildConfig(InAppConfig)]]) },
    );
    const html = renderToString(
      <ContainerProvider container={container}>
        <I18nProvider locale={Locale.Ar} messages={{}}>
          <LanguageSwitcher>
            {(state) => <span>{`${state.mode}:${state.endonym(state.locale)}`}</span>}
          </LanguageSwitcher>
        </I18nProvider>
      </ContainerProvider>,
    );
    expect(html).toBe("<span>in_app:العربية</span>");
  });
});

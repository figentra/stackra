// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of the native `createApp`: it keeps the splash up at once, `Root` renders nothing while it
 *          boots, then mounts the container and the contexts with the default locale's catalogues and hides the
 *          splash; it applies the RTL switch of the i18n configuration; `setLocale` loads the new catalogues and
 *          re-renders; boot runs once across mounts; a failed boot is reported and thrown from `Root`.
 * Boundary: test only; react-native and expo-splash-screen are mocked; `Root` renders with react-dom in jsdom, since
 *           it renders only React components of its own.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decisions 7, 8 and 10).
 */
import { Module } from "@stackra/container";
import type { Wiring } from "@stackra/container";
import { I18nConfig, Locale } from "@stackra/i18n";
import type { I18nKey } from "@stackra/i18n";
import { useLocale, useTranslation } from "@stackra/i18n/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Component } from "react";
import type { ReactNode } from "react";

import type { AppSections } from "#core/types/app-sections.type";
import { createApp } from "#native/functions/create-app.function";
import type { ContextProps } from "#react/contexts/context-props.type";
import { registerContext } from "#react/contexts/register-context";

const splash = vi.hoisted(() => ({
  preventAutoHideAsync: vi.fn(() => Promise.resolve(true)),
  hideAsync: vi.fn(() => Promise.resolve()),
}));
const rtl = vi.hoisted(() => ({ allowRTL: vi.fn(), forceRTL: vi.fn() }));

vi.mock("expo-splash-screen", () => splash);
vi.mock("react-native", () => ({ I18nManager: rtl }));

class MobileModule extends Module {}

class ArabicFirstI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];

  override defaultLocale: Locale = Locale.Ar;
}

/** The screen the navigation context would render: the locale, one translation and a switch to English. */
function Screen() {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  return (
    <button type="button" onClick={() => void setLocale(Locale.En)}>
      {`${locale}:${t("mobile::home.title" as I18nKey)}`}
    </button>
  );
}

registerContext("test_native_screen", ({ children }: ContextProps) => (
  <>
    {children}
    <Screen />
  </>
));

/** Catches the error `Root` throws. */
class Boundary extends Component<{ readonly children: ReactNode }, { readonly error?: Error }> {
  override state: { readonly error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    return this.state.error === undefined ? this.props.children : <p>{this.state.error.message}</p>;
  }
}

const load = vi.fn((locale: Locale) =>
  Promise.resolve({ mobile: { home: { title: locale === Locale.Ar ? "الرئيسية" : "Home" } } }),
);

/** The wiring without its catalogue loader. */
const withoutMessages: Wiring & AppSections = {
  member: "mobile",
  root: MobileModule,
  modules: { mobile: { exports: [], dependsOn: [], type: MobileModule } },
  config: [{ key: "i18n", provide: I18nConfig, override: ArabicFirstI18nConfig }],
  contexts: ["i18n", "test_native_screen"],
};

const wiring: Wiring & AppSections = { ...withoutMessages, messages: load };

describe("createApp (native)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the splash up, boots, mounts the contexts and hides the splash", async () => {
    const app = createApp(MobileModule, { wiring });
    expect(splash.preventAutoHideAsync).toHaveBeenCalledOnce();
    const { container } = render(<app.Root />);
    expect(container.innerHTML).toBe("");
    expect(await screen.findByRole("button")).toHaveProperty("textContent", "ar:الرئيسية");
    expect(splash.hideAsync).toHaveBeenCalled();
    expect(rtl.allowRTL).toHaveBeenCalledWith(true);
    expect(rtl.forceRTL).toHaveBeenCalledWith(true);
  });

  it("switches the locale with its catalogues", async () => {
    const app = createApp(MobileModule, { wiring });
    render(<app.Root />);
    const button = await screen.findByRole("button");
    await act(async () => {
      button.click();
    });
    expect(button.textContent).toBe("en:Home");
    expect(load).toHaveBeenLastCalledWith(Locale.En);
  });

  it("boots once across mounts", async () => {
    const app = createApp(MobileModule, { wiring });
    const first = render(<app.Root />);
    await screen.findByRole("button");
    first.unmount();
    render(<app.Root />);
    await screen.findByRole("button");
    expect(load).toHaveBeenCalledOnce();
  });

  it("reports a failed boot and throws it from Root", async () => {
    const write = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = createApp(MobileModule, { wiring: withoutMessages });
    render(
      <Boundary>
        <app.Root />
      </Boundary>,
    );
    expect((await screen.findByText(/messages/)).textContent).toMatch(/stackra gen/);
    expect(write).toHaveBeenCalled();
    write.mockRestore();
  });
});

/**
 * Stackra file contract:
 * Purpose: proves the web `SettingsForm` renders a switch per boolean key and a text field per number key with their
 *          translated labels, writes a toggled value at the page's scope at once, writes typed input on blur and on
 *          Enter and refuses a value outside its bounds, shows a locked key read-only, restores a refused value with
 *          the refusal's message in the field and the live region, and keeps its layout logical under `dir="rtl"`.
 * Boundary: unit tier, jsdom, the real @stackra/ui components and a real container that binds the case's reader;
 *           the translation returns the key itself.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rule 24); ADR 0213 (decisions 2 and 8); ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { I18nKey } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

import {
  SettingScope,
  SettingsLockedError,
  SettingsReader,
  SettingType,
  settingKeys,
  settingsPage,
} from "#core/index";
import { SettingsForm } from "#react/settings-form/settings-form";
import { fakeSettings } from "#testing/index";

vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

settingKeys({
  messages: {
    marketing: {
      type: SettingType.Boolean,
      default: false,
      scopes: [SettingScope.User],
      label: "messages::settings.marketing.label" as I18nKey,
    },
    digestHour: {
      type: SettingType.Integer,
      default: 9,
      min: 0,
      max: 23,
      scopes: [SettingScope.User],
      label: "messages::settings.digest_hour.label" as I18nKey,
    },
  },
});
const PAGE = settingsPage("messages", { scope: SettingScope.User });

const MARKETING = "messages::settings.marketing.label";
const HOUR = "messages::settings.digest_hour.label";

/** Renders the form over `reader`, under `dir`. */
async function renderOver(reader: object, dir: "ltr" | "rtl" = "ltr") {
  const container = await Container.create([], {
    overrides: new Map([[SettingsReader, reader]]),
  });
  const view = (form: ReactElement) => (
    <ContainerProvider container={container}>
      <div dir={dir}>{form}</div>
    </ContainerProvider>
  );
  const result = render(view(<SettingsForm page={PAGE} />));
  await act(async () => {}); // the stored values load before the user acts
  return result;
}

afterEach(cleanup);

describe("SettingsForm (web)", () => {
  it("writes a toggled preference at the page's scope", async () => {
    const settings = fakeSettings();
    await renderOver(settings);
    const marketing = screen.getByRole("switch", { name: MARKETING }) as HTMLInputElement;
    expect(marketing.checked).toBe(false);
    fireEvent.click(marketing);
    expect(settings.writes).toEqual([
      { page: PAGE, scope: SettingScope.User, values: { marketing: true } },
    ]);
    expect(marketing.checked).toBe(true);
  });

  it("writes typed input on blur and refuses a value outside its bounds", async () => {
    const settings = fakeSettings();
    await renderOver(settings);
    const hour = screen.getByRole("textbox", { name: HOUR });
    fireEvent.change(hour, { target: { value: "25" } });
    fireEvent.blur(hour);
    expect(hour.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("settings::refusals.setting_value_invalid");
    expect(settings.writes).toEqual([]);
    fireEvent.change(hour, { target: { value: "8" } });
    fireEvent.blur(hour);
    expect(settings.writes).toEqual([
      { page: PAGE, scope: SettingScope.User, values: { digestHour: 8 } },
    ]);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("is keyboard reachable and writes typed input on Enter", async () => {
    const settings = fakeSettings();
    await renderOver(settings);
    const hour = screen.getByRole("textbox", { name: HOUR });
    hour.focus();
    expect(document.activeElement).toBe(hour);
    fireEvent.change(hour, { target: { value: "7" } });
    fireEvent.keyDown(hour, { key: "Enter" });
    expect(settings.writes).toEqual([
      { page: PAGE, scope: SettingScope.User, values: { digestHour: 7 } },
    ]);
  });

  it("shows a locked key read-only and restores a refused value with its message", async () => {
    await renderOver({
      read: async () => ({ values: { marketing: false, digestHour: 9 }, locked: ["digestHour"] }),
      write: async () => {
        throw SettingsLockedError.create({ paths: ["marketing"] });
      },
    });
    const hour = screen.getByRole("textbox", { name: HOUR });
    await vi.waitFor(() => expect(hour.hasAttribute("readonly")).toBe(true));
    const marketing = screen.getByRole("switch", { name: MARKETING }) as HTMLInputElement;
    fireEvent.click(marketing);
    await vi.waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("settings::refusals.settings_locked"),
    );
    expect(marketing.checked).toBe(false);
  });

  it("keeps its layout logical and its fields named in right-to-left", async () => {
    const { container } = await renderOver(fakeSettings(), "rtl");
    expect(screen.getByRole("switch", { name: MARKETING })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: HOUR })).toBeTruthy();
    // The form's own wrapper: HeroUI's parts carry their own logical styles.
    const form = container.querySelector("[dir='rtl'] > div");
    expect(form?.className).toMatch(/\bflex-col\b/);
    expect(form?.className).not.toMatch(/\b(text-left|text-right|ml-|mr-|pl-|pr-|left-|right-)/);
  });
});

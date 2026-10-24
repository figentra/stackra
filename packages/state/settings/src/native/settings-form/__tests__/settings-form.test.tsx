/**
 * Stackra file contract:
 * Purpose: proves the native `SettingsForm` renders a switch per boolean key and a text field per number key with
 *          their translated labels, writes a toggled value at the page's scope at once, writes typed input when editing
 *          ends and refuses a value outside its bounds, shows a locked key read-only, and restores a refused value
 *          with the refusal's message.
 * Boundary: unit tier, jsdom. React Native does not render in vitest, so `react-native` and `@stackra/ui/native` are
 *           replaced by DOM stand-ins; the container hands out the reader the case sets, and the translation returns
 *           the key itself.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rule 24); ADR 0213 (decisions 2 and 8).
 */
// @vitest-environment jsdom
import type { I18nKey } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import {
  SettingScope,
  SettingsLockedError,
  SettingType,
  settingKeys,
  settingsPage,
} from "#core/index";
import { SettingsForm } from "#native/settings-form/settings-form";
import { fakeSettings } from "#testing/index";

/** The reader the container hands out. */
const held = vi.hoisted(() => ({ reader: undefined as unknown }));

/** What a stand-in field receives. */
interface FieldProps {
  readonly label: ReactNode;
  readonly value: unknown;
  readonly isReadOnly?: boolean;
  readonly errorMessage?: ReactNode;
  readonly onChange: (value: never) => void;
  readonly onEndEditing?: () => void;
}

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  return {
    Switch: (props: FieldProps) =>
      createElement(
        "div",
        null,
        createElement("button", {
          role: "switch",
          "aria-label": props.label,
          "aria-checked": props.value === true,
          "aria-readonly": props.isReadOnly === true,
          onClick: () => (props.onChange as (value: boolean) => void)(props.value !== true),
        }),
        props.errorMessage,
      ),
    TextField: (props: FieldProps) =>
      createElement(
        "div",
        null,
        createElement("input", {
          "aria-label": props.label,
          value: props.value,
          readOnly: props.isReadOnly === true,
          onChange: (event: { target: { value: string } }) =>
            (props.onChange as (value: string) => void)(event.target.value),
          onBlur: () => props.onEndEditing?.(),
        }),
        props.errorMessage,
      ),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return { View: (props: { children?: ReactNode }) => createElement("div", null, props.children) };
});

vi.mock("@stackra/container/react", () => ({ useContainer: () => ({ get: () => held.reader }) }));

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

afterEach(() => {
  cleanup();
});

describe("SettingsForm", () => {
  it("writes a toggled preference at the page's scope", async () => {
    const settings = fakeSettings();
    held.reader = settings;
    render(<SettingsForm page={PAGE} />);
    await act(async () => {}); // the stored values load before the user acts
    const marketing = await screen.findByRole("switch", {
      name: "messages::settings.marketing.label",
    });
    expect(marketing.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(marketing);
    expect(settings.writes).toEqual([
      { page: PAGE, scope: SettingScope.User, values: { marketing: true } },
    ]);
    expect(marketing.getAttribute("aria-checked")).toBe("true");
  });

  it("writes typed input when editing ends and refuses a value outside its bounds", async () => {
    const settings = fakeSettings();
    held.reader = settings;
    render(<SettingsForm page={PAGE} />);
    await act(async () => {});
    const hour = await screen.findByLabelText("messages::settings.digest_hour.label");
    fireEvent.change(hour, { target: { value: "25" } });
    fireEvent.blur(hour);
    expect(await screen.findByText("settings::refusals.setting_value_invalid")).toBeTruthy();
    expect(settings.writes).toEqual([]);
    fireEvent.change(hour, { target: { value: "8" } });
    fireEvent.blur(hour);
    expect(settings.writes).toEqual([
      { page: PAGE, scope: SettingScope.User, values: { digestHour: 8 } },
    ]);
  });

  it("shows a locked key read-only and restores a refused value with its message", async () => {
    held.reader = {
      read: async () => ({ values: { marketing: false, digestHour: 9 }, locked: ["digestHour"] }),
      write: async () => {
        throw SettingsLockedError.create({ paths: ["marketing"] });
      },
    };
    render(<SettingsForm page={PAGE} />);
    const hour = await screen.findByLabelText("messages::settings.digest_hour.label");
    await vi.waitFor(() => expect(hour.hasAttribute("readonly")).toBe(true));
    const marketing = screen.getByRole("switch", { name: "messages::settings.marketing.label" });
    fireEvent.click(marketing);
    expect(await screen.findByText("settings::refusals.settings_locked")).toBeTruthy();
    expect(marketing.getAttribute("aria-checked")).toBe("false");
  });
});

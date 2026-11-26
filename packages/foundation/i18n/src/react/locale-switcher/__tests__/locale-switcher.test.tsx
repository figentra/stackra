/**
 * Stackra file contract:
 * Purpose: proves `<LocaleSwitcher />` hands its render function the member's locales (or its own), the active locale
 *          and the host's label; switches through the provider's `setLocale` and remembers the choice; switches
 *          through the host's `onChange` instead when given; ignores a tag that is not offered and the active locale;
 *          reports a refused `setLocale` without remembering it; and binds the Arabic locale under `dir="rtl"`.
 * Boundary: unit tier, jsdom (for `document.cookie`), a real `I18nProvider` over a container binding the site config.
 *           The field is a labelled native select standing in for @stackra/ui's `LocaleSwitcher`, which this package
 *           cannot import (@stackra/ui depends on it).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080; ADR 0297 (decision 4); ADR 0504; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { I18nConfig } from "#config/i18n.config";
import { Locale } from "#core/enums/locale.enum";
import { I18nProvider } from "#react/i18n-provider/i18n-provider";
import { LocaleSwitcher } from "#react/locale-switcher/locale-switcher";
import type { LocaleSwitcherState } from "#react/locale-switcher/locale-switcher-state.type";

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];

  override cookieName = "site_locale";
}

/** A wrapper with a container binding the site config and a provider for `locale`. */
async function setUp(locale: Locale = Locale.En, setLocale?: (next: Locale) => Promise<void>) {
  const container = await Container.create(
    [{ member: "web", config: [{ key: "i18n", provide: I18nConfig, override: SiteI18nConfig }] }],
    { overrides: new Map([[I18nConfig, buildConfig(SiteI18nConfig)]]) },
  );
  return (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <I18nProvider
        locale={locale}
        messages={{}}
        {...(setLocale === undefined ? {} : { setLocale })}
      >
        <div dir={dir}>{children}</div>
      </I18nProvider>
    </ContainerProvider>
  );
}

/** A labelled select drawn from the bound switcher, with a live region for a refused switch. */
function Field({ switcher }: { readonly switcher: LocaleSwitcherState }) {
  return (
    <>
      <label htmlFor="locale">{switcher.label ?? "Language"}</label>
      <select
        id="locale"
        value={switcher.value}
        onChange={(event) => switcher.onChange(event.target.value)}
      >
        {switcher.locales.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>
      <p role="alert">{switcher.hasFailed ? "The language could not be changed." : ""}</p>
    </>
  );
}

const draw = (switcher: LocaleSwitcherState) => <Field switcher={switcher} />;

afterEach(() => {
  cleanup();
  document.cookie = "site_locale=; Path=/; Max-Age=0";
});

describe("LocaleSwitcher", () => {
  it("binds the member's locales, the active locale and the host's label", async () => {
    const wrap = await setUp();
    render(wrap(<LocaleSwitcher label="Site language">{draw}</LocaleSwitcher>));
    const field = screen.getByRole<HTMLSelectElement>("combobox", { name: "Site language" });
    expect(field.value).toBe("en");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["en", "ar"]);
  });

  it("offers the host's locales when given and leaves the label to the field otherwise", async () => {
    const wrap = await setUp();
    let seen: LocaleSwitcherState | undefined;
    render(
      wrap(
        <LocaleSwitcher locales={[Locale.Ar]}>
          {(switcher) => {
            seen = switcher;
            return null;
          }}
        </LocaleSwitcher>,
      ),
    );
    expect(seen?.locales).toEqual(["ar"]);
    expect(seen !== undefined && "label" in seen).toBe(false);
  });

  it("switches through the provider's setLocale and remembers the choice", async () => {
    const setLocale = vi.fn(() => Promise.resolve());
    const wrap = await setUp(Locale.En, setLocale);
    render(wrap(<LocaleSwitcher>{draw}</LocaleSwitcher>));
    await act(async () => {
      fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
        target: { value: "ar" },
      });
    });
    expect(setLocale).toHaveBeenCalledWith("ar");
    expect(document.cookie).toContain("site_locale=ar");
    expect(screen.getByRole("alert").textContent).toBe("");
  });

  it("switches through the host's onChange instead when given", async () => {
    const setLocale = vi.fn(() => Promise.resolve());
    const onChange = vi.fn();
    const wrap = await setUp(Locale.En, setLocale);
    render(wrap(<LocaleSwitcher onChange={onChange}>{draw}</LocaleSwitcher>));
    act(() => {
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "ar" } });
    });
    expect(onChange).toHaveBeenCalledWith("ar");
    expect(setLocale).not.toHaveBeenCalled();
    expect(document.cookie).toContain("site_locale=ar");
  });

  it("ignores a tag that is not offered and the active locale", async () => {
    const onChange = vi.fn();
    const wrap = await setUp();
    let seen: LocaleSwitcherState | undefined;
    render(
      wrap(
        <LocaleSwitcher onChange={onChange}>
          {(switcher) => {
            seen = switcher;
            return null;
          }}
        </LocaleSwitcher>,
      ),
    );
    act(() => seen?.onChange("fr"));
    act(() => seen?.onChange("en"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports a refused switch in the host's live region and remembers nothing", async () => {
    const wrap = await setUp(Locale.En, () => Promise.reject(new Error("offline")));
    render(wrap(<LocaleSwitcher>{draw}</LocaleSwitcher>));
    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "ar" } });
    });
    expect(screen.getByRole("alert").textContent).toBe("The language could not be changed.");
    expect(document.cookie).not.toContain("site_locale=ar");
  });

  it("binds the Arabic locale under right-to-left", async () => {
    const wrap = await setUp(Locale.Ar);
    render(wrap(<LocaleSwitcher label="اللغة">{draw}</LocaleSwitcher>, "rtl"));
    const field = screen.getByRole<HTMLSelectElement>("combobox", { name: "اللغة" });
    expect(field.value).toBe("ar");
    expect(field.closest("[dir='rtl']")).toBeTruthy();
  });
});

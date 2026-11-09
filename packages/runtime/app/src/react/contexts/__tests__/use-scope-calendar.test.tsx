/**
 * Stackra file contract:
 * Purpose: unit tests of `useScopeCalendar` through `I18nMount`: a tenant whose `DisplaySettings.calendar` is the Umm
 *          al-Qura calendar sees `useDateTime` write Hijri dates once its settings load, and an app whose container binds
 *          no `SettingsReader` stays Gregorian.
 * Boundary: test only; jsdom, the settings reader faked in the container.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0192 (decision 3); ADR 0295 (decision 10).
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { CalendarSystem, I18nConfig, Locale } from "@stackra/i18n";
import { useDateTime } from "@stackra/i18n/react";
import { DisplaySettings, SettingsReader } from "@stackra/settings";
import { describe, expect, it } from "@stackra/testing";
import { render, screen } from "@testing-library/react";

import { I18nMount } from "#react/contexts/i18n-mount";

/** 1 Ramadan 1447 in the Umm al-Qura calendar. */
const RAMADAN_1 = "2026-02-18T12:00:00Z";

/** A reader whose tenant chose `calendar`. */
const readerOf = (calendar: CalendarSystem) =>
  ({
    get: () => Promise.resolve(Object.assign(new DisplaySettings(), { calendar })),
  }) as unknown as SettingsReader;

/** A container binding the i18n configuration and, when given, the settings reader. */
const container = (reader?: SettingsReader) =>
  Container.create([{ member: "web", config: [{ key: "i18n", provide: I18nConfig }] }], {
    overrides: new Map<Token, object>([
      [I18nConfig, buildConfig(I18nConfig)],
      ...(reader === undefined ? [] : [[SettingsReader, reader] as const]),
    ]),
  });

/** Writes the Ramadan day as `useDateTime` formats it. */
function Day() {
  const dateTime = useDateTime();
  return (
    <span>
      {dateTime(RAMADAN_1, { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" })}
    </span>
  );
}

describe("useScopeCalendar", () => {
  it("writes Hijri dates for a tenant on the Umm al-Qura calendar", async () => {
    render(
      <ContainerProvider container={await container(readerOf(CalendarSystem.IslamicUmalqura))}>
        <I18nMount locale={Locale.En} messages={{}}>
          <Day />
        </I18nMount>
      </ContainerProvider>,
    );
    expect(await screen.findByText(/1447/)).toBeTruthy();
  });

  it("stays Gregorian without a settings reader", async () => {
    render(
      <ContainerProvider container={await container()}>
        <I18nMount locale={Locale.En} messages={{}}>
          <Day />
        </I18nMount>
      </ContainerProvider>,
    );
    expect(await screen.findByText(/2026/)).toBeTruthy();
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `useDateTime()`: a `Date`, an ISO string and epoch milliseconds format alike in the active
 *          locale with Intl's options, the configured digits apply, an invalid date is refused, a native region's zone applies unless the options name one, and the hook throws
 *          outside a provider.
 * Boundary: test only; every case names `timeZone: "UTC"` or a region zone so it does not depend on the machine's zone.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0269; ADR 0192 (decisions 2 and 3).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { I18nConfig } from "#config/i18n.config";
import { HourCycle } from "#core/enums/hour-cycle.enum";
import { Locale } from "#core/enums/locale.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import type { RegionFormat } from "#core/types/region-format.type";
import { useDateTime } from "#react/formatting/use-date-time";
import { I18nProvider } from "#react/i18n-provider/i18n-provider";

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

class ArabicDigitsConfig extends SiteI18nConfig {
  override numerals: NumberingSystem = NumberingSystem.Arab;
}

/** What `useDateTime()` returns. */
type Formatter = ReturnType<typeof useDateTime>;

/** Hands the hook's result to the test. */
function Probe({ onFormatter }: { readonly onFormatter: (formatter: Formatter) => void }) {
  onFormatter(useDateTime());
  return null;
}

/** The `useDateTime()` result for `locale` under config `type`. */
async function formatter(
  locale: Locale,
  type: typeof I18nConfig = SiteI18nConfig,
  region?: RegionFormat,
) {
  const container = await Container.create(
    [{ member: "web", config: [{ key: "i18n", provide: I18nConfig, override: type }] }],
    { overrides: new Map([[I18nConfig, buildConfig(type)]]) },
  );
  const seen: Formatter[] = [];
  renderToString(
    <ContainerProvider container={container}>
      <I18nProvider locale={locale} messages={{}} region={region}>
        <Probe onFormatter={(next) => seen.push(next)} />
      </I18nProvider>
    </ContainerProvider>,
  );
  const [dateTime] = seen;
  if (dateTime === undefined) throw new Error("Probe did not render");
  return dateTime;
}

const UTC = { timeZone: "UTC" } as const;

describe("useDateTime", () => {
  it("formats a Date, an ISO string and epoch milliseconds alike", async () => {
    const dateTime = await formatter(Locale.En);
    const at = "2026-10-24T09:30:00Z";
    const expected = dateTime(new Date(at), { ...UTC, dateStyle: "medium" });
    expect(expected).toBe("Oct 24, 2026");
    expect(dateTime(at, { ...UTC, dateStyle: "medium" })).toBe(expected);
    expect(dateTime(Date.parse(at), { ...UTC, dateStyle: "medium" })).toBe(expected);
  });

  it("applies the configured digits", async () => {
    const dateTime = await formatter(Locale.En, ArabicDigitsConfig);
    expect(dateTime("2026-10-24T09:30:00Z", { ...UTC, year: "numeric" })).toBe("٢٠٢٦");
  });

  it("shows dates in a native region's zone unless the options name one", async () => {
    const region: RegionFormat = {
      region: null,
      measurementSystem: "metric",
      timeZone: "Asia/Riyadh",
      weekStart: 6,
      hourCycle: HourCycle.H23,
    };
    const dateTime = await formatter(Locale.En, SiteI18nConfig, region);
    expect(dateTime("2026-10-24T21:30:00Z", { hour: "2-digit", minute: "2-digit" })).toBe("00:30");
    expect(dateTime("2026-10-24T21:30:00Z", { ...UTC, hour: "2-digit", minute: "2-digit" })).toBe(
      "21:30",
    );
  });

  it("refuses an invalid date instead of printing Invalid Date", async () => {
    const dateTime = await formatter(Locale.En);
    expect(() => dateTime("not a date")).toThrow(/not a valid date/);
  });

  it("throws outside a provider", () => {
    expect(() => renderToString(<Probe onFormatter={() => undefined} />)).toThrow(/I18nProvider/);
  });
});

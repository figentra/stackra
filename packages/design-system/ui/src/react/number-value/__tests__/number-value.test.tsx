/**
 * Stackra file contract:
 * Purpose: proves the web NumberValue, PercentValue, BytesValue and MoneyValue write in the provider's locale and
 *          follow the digits setting (Arabic-Indic digits when the i18n provider asks for them).
 * Boundary: jsdom with the real I18nProvider of @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0192 (digits setting); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { BytesValue } from "#react/number-value/bytes-value";
import { MoneyValue } from "#react/number-value/money-value";
import { NumberValue } from "#react/number-value/number-value";
import { PercentValue } from "#react/number-value/percent-value";

describe("number values (web)", () => {
  it("write numbers, shares, sizes and money", () => {
    const { container } = render(
      <p>
        <NumberValue value={12_840.5} options={{ maximumFractionDigits: 0 }} />|
        <PercentValue value={0.042} fractionDigits={1} showSign />|
        <BytesValue value={1_500_000} />|
        <MoneyValue amount={3450} currency="SAR" />
      </p>,
    );
    const [number, percent, bytes, money] = (container.textContent ?? "").split("|");
    expect(number).toBe("12,841");
    expect(percent).toBe("+4.2%");
    expect(bytes).toMatch(/^1\.5\sMB$/u);
    expect(money).toMatch(/SAR\s3,450\.00/u);
    expect(container.querySelectorAll("bdi")).toHaveLength(4);
  });

  it("follow an Arabic locale with Arabic-Indic digits", () => {
    const { container } = render(
      <DesignSystemContext value={{ locale: "ar-SA-u-nu-arab" } as DesignSystemState}>
        <NumberValue value={2026} options={{ useGrouping: false }} />
      </DesignSystemContext>,
    );
    expect(container.textContent).toBe("٢٠٢٦");
  });
});

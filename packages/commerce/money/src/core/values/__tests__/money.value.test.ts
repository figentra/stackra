/**
 * Stackra file contract:
 * Purpose: unit tests of `Money`: minor units as a safe-integer JavaScript number (beyond MAX_SAFE_INTEGER refused),
 *          ISO 4217 exponents, `Money.of` as a pure constant gen evaluates, every rounding mode on exact halves and
 *          negatives, exact arithmetic, `zero` and `max`, on decimal factors, mixed currencies refused, and allocation that never loses a
 *          minor unit and splits deterministically.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0220 (decisions 1 to
 *                     3); ADR 0294 (decisions 26 and 27).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Rounding } from "#core/enums/rounding.enum";
import type { CurrencyCode } from "#core/types/currency-code.type";
import { Money } from "#core/values/money.value";

const MAX = Number.MAX_SAFE_INTEGER;

/** The minor units of each part, for comparing a split. */
const minors = (parts: Money[]) => parts.map((part) => part.minor);

describe("Money.ofMinor", () => {
  it("holds minor units as a number and the currency as given", () => {
    const price = Money.ofMinor(2_000, "USD");
    expect(price.minor).toBe(2_000);
    expect(price.currency).toBe("USD");
    expect(price).toBeInstanceOf(Money);
  });

  it("accepts the safe-integer limits in both directions", () => {
    expect(Money.ofMinor(MAX, "USD").minor).toBe(MAX);
    expect(Money.ofMinor(-MAX, "USD").minor).toBe(-MAX);
  });

  it.each([MAX + 1, -MAX - 1, 2 ** 64, 12.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "refuses %s minor units",
    (minor) => {
      expect(() => Money.ofMinor(minor, "USD")).toThrow(RangeError);
    },
  );

  it.each(["usd", "XXX", "XAU", "EURO", "", "US"])("refuses the currency %j", (currency) => {
    expect(() => Money.ofMinor(100, currency)).toThrow(RangeError);
  });

  it("stores -0 as 0", () => {
    expect(Object.is(Money.ofMinor(-0, "USD").minor, 0)).toBe(true);
  });

  it("serialises to the wire form, because its own fields are exactly minor and currency", () => {
    expect(JSON.stringify(Money.ofMinor(1_250, "USD"))).toBe('{"minor":1250,"currency":"USD"}');
  });

  it("types the currency as CurrencyCode while taking a plain string", () => {
    const fromWire: string = "EUR";
    const code: CurrencyCode = Money.ofMinor(1, fromWire).currency;
    expect(code).toBe("EUR");
  });
});

describe("Money.of", () => {
  it.each([
    ["12.50", "USD", 1_250],
    ["12.5", "USD", 1_250],
    ["12", "USD", 1_200],
    ["0.05", "USD", 5],
    ["-0.05", "USD", -5],
    ["-0", "USD", 0],
    ["1000", "JPY", 1_000],
    ["1.234", "KWD", 1_234],
    ["1.5", "BHD", 1_500],
    ["0.0001", "CLF", 1],
    ["90071992547409.91", "USD", MAX],
  ] as const)("reads %s %s as %d minor units", (decimal, currency, minor) => {
    expect(Money.of(decimal, currency).minor).toBe(minor);
  });

  it.each([
    ["1.234", "USD"],
    ["1.5", "JPY"],
    ["1,00", "USD"],
    ["", "USD"],
    ["+1", "USD"],
    [".5", "USD"],
    ["1.", "USD"],
    ["1e3", "USD"],
    [" 1", "USD"],
    ["90071992547409.92", "USD"],
    ["1.00", "usd"],
  ] as const)("refuses %j in %s", (decimal, currency) => {
    expect(() => Money.of(decimal, currency)).toThrow(RangeError);
  });

  it("is a pure function of its arguments, so gen can evaluate it as a constant default", () => {
    const random = vi.spyOn(Math, "random");
    const now = vi.spyOn(Date, "now");
    const first = Money.of("10.00", "USD");
    const second = Money.of("10.00", "USD");
    expect(first.equals(second)).toBe(true);
    expect(JSON.stringify(first)).toBe('{"minor":1000,"currency":"USD"}');
    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
    random.mockRestore();
    now.mockRestore();
  });

  it("returns a new value each call, so a shared default is never mutated through another", () => {
    expect(Money.of("1.00", "USD")).not.toBe(Money.of("1.00", "USD"));
  });
});

describe("Money.zero", () => {
  it("is nothing in the currency, the start of a sum", () => {
    const zero = Money.zero("KWD");
    expect(zero.minor).toBe(0);
    expect(zero.currency).toBe("KWD");
    const lines = [Money.ofMinor(1_250, "KWD").times(2), Money.ofMinor(5, "KWD")];
    expect(lines.reduce((sum, line) => sum.plus(line), zero).minor).toBe(2_505);
  });

  it("refuses an unknown currency", () => {
    expect(() => Money.zero("usd")).toThrow(RangeError);
  });
});

describe("Money.max", () => {
  it("clamps a total at zero, as the order pricing does", () => {
    const zero = Money.zero("USD");
    expect(Money.max(Money.ofMinor(-300, "USD"), zero)).toBe(zero);
    expect(Money.max(Money.ofMinor(300, "USD"), zero).minor).toBe(300);
  });

  it("takes any number of amounts and keeps the first on a tie", () => {
    const first = Money.ofMinor(7, "USD");
    expect(Money.max(first).minor).toBe(7);
    expect(
      Money.max(Money.ofMinor(1, "USD"), Money.ofMinor(9, "USD"), Money.ofMinor(3, "USD")).minor,
    ).toBe(9);
    expect(Money.max(first, Money.ofMinor(7, "USD"))).toBe(first);
  });

  it("refuses mixed currencies", () => {
    expect(() => Money.max(Money.ofMinor(1, "USD"), Money.ofMinor(1, "EUR"))).toThrow(RangeError);
  });
});

describe("Money#toDecimal", () => {
  it.each([
    [1_250, "USD", "12.50"],
    [5, "USD", "0.05"],
    [-5, "USD", "-0.05"],
    [0, "USD", "0.00"],
    [100_000, "USD", "1000.00"],
    [1_000, "JPY", "1000"],
    [-7, "JPY", "-7"],
    [1_250, "KWD", "1.250"],
    [1, "CLF", "0.0001"],
  ] as const)("writes %d %s as %s", (minor, currency, decimal) => {
    expect(Money.ofMinor(minor, currency).toDecimal()).toBe(decimal);
  });

  it("round-trips with Money.of", () => {
    for (const [decimal, currency] of [
      ["12.50", "USD"],
      ["-3.007", "KWD"],
      ["42", "JPY"],
    ] as const)
      expect(Money.of(decimal, currency).toDecimal()).toBe(decimal);
  });
});

describe("Money#plus and Money#minus", () => {
  it("adds and subtracts in the same currency and returns new values", () => {
    const a = Money.ofMinor(1_000, "USD");
    const b = Money.ofMinor(250, "USD");
    expect(a.plus(b).minor).toBe(1_250);
    expect(a.minus(b).minor).toBe(750);
    expect(b.minus(a).minor).toBe(-750);
    expect(a.minor).toBe(1_000);
  });

  it("refuses mixed currencies", () => {
    const usd = Money.ofMinor(100, "USD");
    const eur = Money.ofMinor(100, "EUR");
    expect(() => usd.plus(eur)).toThrow(RangeError);
    expect(() => usd.minus(eur)).toThrow(RangeError);
  });

  it("refuses a result beyond the safe-integer limit", () => {
    expect(() => Money.ofMinor(MAX, "USD").plus(Money.ofMinor(1, "USD"))).toThrow(RangeError);
    expect(() => Money.ofMinor(-MAX, "USD").minus(Money.ofMinor(1, "USD"))).toThrow(RangeError);
  });
});

describe("Money#times", () => {
  it.each([
    [Rounding.Down, 14],
    [Rounding.Up, 15],
    [Rounding.HalfUp, 15],
    [Rounding.HalfEven, 14],
  ] as const)("rounds the exact half 145 × 0.1 = 14.5 with %s to %d", (rounding, minor) => {
    expect(Money.ofMinor(145, "USD").times(0.1, rounding).minor).toBe(minor);
  });

  it.each([
    [Rounding.Down, -14],
    [Rounding.Up, -15],
    [Rounding.HalfUp, -15],
    [Rounding.HalfEven, -14],
  ] as const)("rounds -14.5 with %s to %d, mirroring the positive amount", (rounding, minor) => {
    expect(Money.ofMinor(-145, "USD").times(0.1, rounding).minor).toBe(minor);
  });

  it("rounds half-even by default (15.5 → 16, 14.5 → 14)", () => {
    expect(Money.ofMinor(155, "USD").times(0.1).minor).toBe(16);
    expect(Money.ofMinor(145, "USD").times(0.1).minor).toBe(14);
  });

  it("reads a factor as the decimal it prints, so 100 × 0.145 is exactly 14.5", () => {
    // 100 * 0.145 in floating point is 14.499999999999998, which would round half-up to 14.
    expect(Money.ofMinor(100, "USD").times(0.145, Rounding.HalfUp).minor).toBe(15);
    expect(Money.ofMinor(10_000_000, "USD").times(1e-7).minor).toBe(1);
  });

  it("multiplies by integers and negatives exactly", () => {
    expect(Money.ofMinor(1_999, "USD").times(3).minor).toBe(5_997);
    expect(Money.ofMinor(1_999, "USD").times(-1).minor).toBe(-1_999);
    expect(Money.ofMinor(1_999, "USD").times(0.15, Rounding.Down).minor).toBe(299);
  });

  it("refuses a non-finite factor and a product beyond the safe-integer limit", () => {
    expect(() => Money.ofMinor(1, "USD").times(Number.NaN)).toThrow(RangeError);
    expect(() => Money.ofMinor(1, "USD").times(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => Money.ofMinor(MAX, "USD").times(2)).toThrow(RangeError);
    expect(() => Money.ofMinor(1, "USD").times(1e21)).toThrow(RangeError);
  });
});

describe("Money#divide", () => {
  it.each([
    [Rounding.Down, 833],
    [Rounding.Up, 834],
    [Rounding.HalfUp, 833],
    [Rounding.HalfEven, 833],
  ] as const)("divides 10 000 by 12 with %s to %d", (rounding, minor) => {
    expect(Money.ofMinor(10_000, "USD").divide(12, rounding).minor).toBe(minor);
  });

  it.each([
    [25, Rounding.HalfEven, 12],
    [35, Rounding.HalfEven, 18],
    [25, Rounding.HalfUp, 13],
    [-25, Rounding.HalfEven, -12],
    [-25, Rounding.HalfUp, -13],
    [-25, Rounding.Down, -12],
    [-25, Rounding.Up, -13],
  ] as const)("divides %d by 2 with %s to %d", (amount, rounding, minor) => {
    expect(Money.ofMinor(amount, "USD").divide(2, rounding).minor).toBe(minor);
  });

  it("shows a yearly price per month rounded down, as the pricing table does", () => {
    expect(Money.ofMinor(9_900, "USD").divide(12, Rounding.Down).toDecimal()).toBe("8.25");
    expect(Money.ofMinor(9_999, "USD").divide(12, Rounding.Down).toDecimal()).toBe("8.33");
  });

  it("divides exactly when there is no remainder, by fractions and by negatives", () => {
    expect(Money.ofMinor(1_000, "USD").divide(8).minor).toBe(125);
    expect(Money.ofMinor(25, "USD").divide(0.5).minor).toBe(50);
    expect(Money.ofMinor(25, "USD").divide(-2, Rounding.HalfUp).minor).toBe(-13);
  });

  it("rounds half-even by default", () => {
    expect(Money.ofMinor(25, "USD").divide(2).minor).toBe(12);
  });

  it("refuses zero, a non-finite divisor and an unknown rounding", () => {
    expect(() => Money.ofMinor(1, "USD").divide(0)).toThrow(RangeError);
    expect(() => Money.ofMinor(1, "USD").divide(Number.NaN)).toThrow(RangeError);
    expect(() => Money.ofMinor(10, "USD").divide(3, "nearest" as unknown as Rounding)).toThrow(
      RangeError,
    );
  });

  it("keeps the currency", () => {
    expect(Money.ofMinor(1_000, "JPY").divide(3).currency).toBe("JPY");
  });
});

describe("Money#allocate", () => {
  it.each([
    [1_000, [1, 1, 1], [334, 333, 333]],
    [100, [70, 30], [70, 30]],
    [5, [1, 1, 1, 1], [2, 1, 1, 1]],
    [1_001, [0.2, 0.8], [200, 801]],
    [3, [1, 0, 1], [2, 0, 1]],
    [-1_000, [1, 1, 1], [-334, -333, -333]],
    [0, [1, 2], [0, 0]],
  ] as const)("splits %d by %j into %j", (amount, ratios, expected) => {
    expect(minors(Money.ofMinor(amount, "USD").allocate(ratios))).toEqual(expected);
  });

  it("gives the left-over units to the largest remainders, then to the earlier part", () => {
    expect(minors(Money.ofMinor(10, "JPY").allocate([1, 2]))).toEqual([3, 7]);
    expect(minors(Money.ofMinor(2, "USD").allocate([1, 1, 1]))).toEqual([1, 1, 0]);
  });

  it("never loses or invents a minor unit, and each part is within one unit of its exact share", () => {
    const ratioSets = [
      [1, 1, 1],
      [3, 7],
      [0.1, 0.2, 0.7],
      [1, 0, 2, 5],
      [13],
      [1, 1, 1, 1, 1, 1, 1],
    ];
    for (const amount of [0, 1, 7, 99, 1_001, 123_457, -9_999, 2 ** 40 + 3]) {
      for (const ratios of ratioSets) {
        const parts = minors(Money.ofMinor(amount, "USD").allocate(ratios));
        const total = ratios.reduce((sum, ratio) => sum + ratio, 0);
        expect(parts.reduce((sum, part) => BigInt(part) + sum, 0n)).toBe(BigInt(amount));
        parts.forEach((part, index) =>
          expect(Math.abs(part - (amount * (ratios[index] ?? 0)) / total)).toBeLessThan(1.000_001),
        );
      }
    }
  });

  it("keeps the currency and returns new values", () => {
    const whole = Money.ofMinor(100, "EUR");
    const parts = whole.allocate([1, 1]);
    expect(parts.map((part) => part.currency)).toEqual(["EUR", "EUR"]);
    expect(parts).not.toContain(whole);
  });

  it.each([[[]], [[-1, 2]], [[0, 0]], [[Number.NaN]], [[Number.POSITIVE_INFINITY, 1]]])(
    "refuses the ratios %j",
    (ratios) => {
      expect(() => Money.ofMinor(100, "USD").allocate(ratios)).toThrow(RangeError);
    },
  );
});

describe("Money#equals", () => {
  it("compares amount and currency", () => {
    const price = Money.ofMinor(100, "USD");
    expect(price.equals(Money.ofMinor(100, "USD"))).toBe(true);
    expect(price.equals(Money.ofMinor(101, "USD"))).toBe(false);
    expect(price.equals(Money.ofMinor(100, "EUR"))).toBe(false);
  });
});

/**
 * Stackra file contract:
 * Purpose: property tests of `Money` (ADR 0220 enforcement): every rounding mode of `divide` and `times` agrees with an
 *          independent floor/ceiling model on any amount and divisor, so two rounding paths cannot disagree on a minor
 *          unit; allocation sums exactly, keeps each part within one minor unit of its exact share, is deterministic,
 *          mirrors for refunds and ignores the scale of its ratios; cash rounding lands on its step and is idempotent;
 *          a decimal string round-trips; sums beyond the safe-integer limit are refused, never rounded.
 * Boundary: test only; fast-check generates the inputs, and a counterexample it finds is kept as an example test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0220 (decisions 1 to 3 and the enforcement line); ADR 0182 (unit tier); ADR 0022; ADR 0269.
 */
import { Rounding } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import * as fc from "fast-check";

import { CURRENCIES } from "#core/constants/currencies.constant";
import { CashRounding } from "#core/values/cash-rounding.value";
import { Money } from "#core/values/money.value";

/** The largest minor amount, as a BigInt. */
const MAX = BigInt(Number.MAX_SAFE_INTEGER);

/** Every rounding mode. */
const MODES = [Rounding.Down, Rounding.Up, Rounding.HalfUp, Rounding.HalfEven] as const;

/** Every currency code `Money` knows. */
const CODES = Object.keys(CURRENCIES);

/** Any safe minor amount, the edges included. */
const minor = fc.oneof(
  fc.maxSafeInteger(),
  fc.integer({ min: -1_000_000, max: 1_000_000 }),
  fc.constantFrom(0, 1, -1, Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER),
);

/** A rounding mode. */
const mode = fc.constantFrom(...MODES);

/** A non-zero integer divisor. */
const divisor = fc
  .oneof(
    fc.integer({ min: -1000, max: 1000 }),
    fc.integer({ min: -2_147_483_648, max: 2_147_483_647 }),
  )
  .filter((value) => value !== 0);

/** A plain decimal string with up to eight fraction digits (`"-3.672500"`, `"0.145"`, `"12"`). */
const decimal = fc
  .record({ digits: fc.bigInt({ min: -(10n ** 12n), max: 10n ** 12n }), scale: fc.nat({ max: 8 }) })
  .map(({ digits, scale }) => {
    const absolute = String(digits < 0n ? -digits : digits).padStart(scale + 1, "0");
    const text = scale === 0 ? absolute : `${absolute.slice(0, -scale)}.${absolute.slice(-scale)}`;
    return { text: digits < 0n ? `-${text}` : text, digits, scale };
  });

/**
 * The reference rounding of `n / d`, built from the floor and the ceiling rather than from truncation as `Money` is:
 * `Down` and `Up` pick the neighbour toward and away from zero, the half modes the nearer one, and an exact half goes
 * away from zero (`HalfUp`) or to the even neighbour (`HalfEven`).
 */
function reference(n: bigint, d: bigint, rounding: Rounding): bigint {
  const [num, den] = d < 0n ? [-n, -d] : [n, d];
  const floor = num >= 0n ? num / den : -((-num + den - 1n) / den);
  if (floor * den === num) return floor;
  const ceil = floor + 1n;
  const [toward, away] = num >= 0n ? [floor, ceil] : [ceil, floor];
  const below = num - floor * den;
  const above = ceil * den - num;
  switch (rounding) {
    case Rounding.Down: {
      return toward;
    }
    case Rounding.Up: {
      return away;
    }
    case Rounding.HalfUp: {
      return below === above ? away : below < above ? floor : ceil;
    }
    default: {
      return below === above ? (floor % 2n === 0n ? floor : ceil) : below < above ? floor : ceil;
    }
  }
}

/** The result of `operation`, or the class of the error it threw. */
function outcome(operation: () => Money): number | string {
  try {
    return operation().minor;
  } catch (error) {
    return (error as Error).constructor.name;
  }
}

/** What `reference` predicts: the amount, or a `RangeError` when it is beyond the safe-integer limit. */
function predicted(value: bigint): number | string {
  return value > MAX || value < -MAX ? "RangeError" : Number(value);
}

describe("Money rounding (properties)", () => {
  it("divides by any integer as the floor/ceiling model rounds, in every mode", () => {
    fc.assert(
      fc.property(minor, divisor, mode, (amount, by, rounding) => {
        expect(outcome(() => Money.ofMinor(amount, "USD").divide(by, rounding))).toBe(
          predicted(reference(BigInt(amount), BigInt(by), rounding)),
        );
      }),
    );
  });

  it("multiplies by any decimal string as the floor/ceiling model rounds, or refuses beyond the limit", () => {
    fc.assert(
      fc.property(minor, decimal, mode, (amount, factor, rounding) => {
        expect(outcome(() => Money.ofMinor(amount, "USD").times(factor.text, rounding))).toBe(
          predicted(
            reference(BigInt(amount) * factor.digits, 10n ** BigInt(factor.scale), rounding),
          ),
        );
      }),
    );
  });

  it("divides by a decimal string as the floor/ceiling model rounds", () => {
    fc.assert(
      fc.property(
        minor,
        decimal.filter((value) => value.digits !== 0n),
        mode,
        (amount, by, rounding) => {
          expect(outcome(() => Money.ofMinor(amount, "USD").divide(by.text, rounding))).toBe(
            predicted(reference(BigInt(amount) * 10n ** BigInt(by.scale), by.digits, rounding)),
          );
        },
      ),
    );
  });

  it("reads a number factor as the decimal it prints as, so it agrees with the same string", () => {
    fc.assert(
      fc.property(
        minor,
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        mode,
        (amount, factor, rounding) => {
          const money = Money.ofMinor(amount, "USD");
          const printed = String(factor);
          fc.pre(!printed.includes("e"));
          expect(outcome(() => money.times(factor, rounding))).toBe(
            outcome(() => money.times(printed, rounding)),
          );
        },
      ),
    );
  });

  it("rounds a refund as the mirror of the charge, in every mode", () => {
    fc.assert(
      fc.property(minor, divisor, mode, (amount, by, rounding) => {
        const charge = Money.ofMinor(amount, "USD").divide(by, rounding);
        const refund = Money.ofMinor(-amount, "USD").divide(by, rounding);
        expect(refund.minor).toBe(-charge.minor || 0);
      }),
    );
  });

  it("rounds half-even when no mode is given", () => {
    fc.assert(
      fc.property(minor, divisor, (amount, by) => {
        const money = Money.ofMinor(amount, "USD");
        expect(money.divide(by).minor).toBe(money.divide(by, Rounding.HalfEven).minor);
      }),
    );
  });
});

describe("Money.allocate (properties)", () => {
  /** One to twelve whole weights, not all zero. */
  const weights = fc
    .array(fc.nat({ max: 1000 }), { minLength: 1, maxLength: 12 })
    .filter((list) => list.some((weight) => weight > 0));

  it("sums to the amount exactly, in its currency, one part per ratio", () => {
    fc.assert(
      fc.property(minor, weights, fc.constantFrom(...CODES), (amount, ratios, code) => {
        const parts = Money.ofMinor(amount, code).allocate(ratios);
        expect(parts).toHaveLength(ratios.length);
        expect(parts.every((part) => part.currency === code)).toBe(true);
        expect(parts.reduce((sum, part) => sum + BigInt(part.minor), 0n)).toBe(BigInt(amount));
      }),
    );
  });

  it("keeps every part within one minor unit of its exact share, toward zero, and gives a zero ratio nothing", () => {
    fc.assert(
      fc.property(minor, weights, (amount, ratios) => {
        const total = BigInt(ratios.reduce((sum, ratio) => sum + ratio, 0));
        const parts = Money.ofMinor(amount, "USD").allocate(ratios);
        for (const [index, part] of parts.entries()) {
          const exact = BigInt(amount) * BigInt(ratios[index] ?? 0); // the share is exact / total
          const scaled = BigInt(part.minor) * total;
          // within one minor unit of the share: |exact / total - part| < 1
          expect(exact - scaled < total && scaled - exact < total).toBe(true);
          expect(Math.sign(part.minor) === Math.sign(amount) || part.minor === 0).toBe(true);
          if (ratios[index] === 0) expect(part.minor).toBe(0);
        }
      }),
    );
  });

  it("splits the same way every time, and a refund as the mirror of the charge", () => {
    fc.assert(
      fc.property(minor, weights, (amount, ratios) => {
        const minors = (value: number) =>
          Money.ofMinor(value, "USD")
            .allocate(ratios)
            .map((part) => part.minor);
        expect(minors(amount)).toEqual(minors(amount));
        expect(minors(-amount)).toEqual(minors(amount).map((part) => -part || 0));
      }),
    );
  });

  it("splits by the ratios' proportions, not their scale", () => {
    fc.assert(
      fc.property(minor, weights, fc.integer({ min: 1, max: 1000 }), (amount, ratios, scale) => {
        const money = Money.ofMinor(amount, "USD");
        expect(
          money.allocate(ratios.map((ratio) => ratio * scale)).map((part) => part.minor),
        ).toEqual(money.allocate(ratios).map((part) => part.minor));
      }),
    );
  });

  it("splits equal ratios into parts one minor unit apart at most, the earlier parts first", () => {
    fc.assert(
      fc.property(minor, fc.integer({ min: 1, max: 50 }), (amount, count) => {
        const parts = Money.ofMinor(amount, "USD")
          .allocate(Array.from({ length: count }, () => 1))
          .map((part) => Math.abs(part.minor));
        for (let index = 1; index < parts.length; index++) {
          const [previous = 0, current = 0] = [parts[index - 1], parts[index]];
          expect(previous - current === 0 || previous - current === 1).toBe(true);
        }
      }),
    );
  });

  it("sums exactly for any fractional ratios, read as the decimals they print as", () => {
    fc.assert(
      fc.property(
        minor,
        fc
          .array(fc.double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true }), {
            minLength: 1,
            maxLength: 8,
          })
          .filter((list) => list.some((ratio) => ratio > 0)),
        (amount, ratios) => {
          const parts = Money.ofMinor(amount, "USD").allocate(ratios);
          expect(parts.reduce((sum, part) => sum + BigInt(part.minor), 0n)).toBe(BigInt(amount));
        },
      ),
    );
  });
});

describe("CashRounding (properties)", () => {
  it("lands on a step, within one step (half a step for the half modes), and keeps a total already on one", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1e12, max: 1e12 }),
        fc.integer({ min: 1, max: 10_000 }),
        mode,
        (amount, step, rounding) => {
          const cash = CashRounding.of({ currency: "CHF", incrementMinor: step, rounding });
          const total = Money.ofMinor(amount, "CHF");
          const rounded = cash.apply(total);
          const moved = Math.abs(rounded.minor - amount);
          expect(rounded.minor % step === 0).toBe(true);
          expect(
            rounding === Rounding.HalfUp || rounding === Rounding.HalfEven
              ? 2 * moved <= step
              : moved < step,
          ).toBe(true);
          expect(cash.apply(rounded).equals(rounded)).toBe(true);
          expect(cash.difference(total).minor).toBe(rounded.minor - amount);
        },
      ),
    );
  });
});

describe("Money arithmetic and decimals (properties)", () => {
  it("round-trips any amount through its decimal string, in every currency", () => {
    fc.assert(
      fc.property(minor, fc.constantFrom(...CODES), (amount, code) => {
        const money = Money.ofMinor(amount, code);
        expect(Money.of(money.toDecimal(), code).equals(money)).toBe(true);
      }),
    );
  });

  it("adds and subtracts exactly, and refuses a result beyond the safe-integer limit", () => {
    fc.assert(
      fc.property(minor, minor, (left, right) => {
        const [a, b] = [Money.ofMinor(left, "EUR"), Money.ofMinor(right, "EUR")];
        expect(outcome(() => a.plus(b))).toBe(predicted(BigInt(left) + BigInt(right)));
        expect(outcome(() => a.minus(b))).toBe(predicted(BigInt(left) - BigInt(right)));
        expect(outcome(() => b.plus(a))).toBe(outcome(() => a.plus(b)));
      }),
    );
  });
});

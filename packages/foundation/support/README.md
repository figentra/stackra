# @stackra/support

Dependency-free pure helpers for Stackra packages and services, grown on demand. It holds `time`, `Quantity` (an
exact amount with a unit), `canonicalJson` and `canonicalHash` (the one canonical form chains and signatures hash),
`restrictedGtin` (GS1 restricted-circulation numbers) and `code128` (a Code 128 and GS1-128 encoder); string, array, async and object helpers are added when a package first needs them, not before.

**Tier:** `tier:lib` (`packages/foundation/support`). Laid out in the programming model v3.1 (ADR 0294, 0305).
No workspace dependency, no runtime dependency, no host globals: it runs unchanged in Node, Encore, browsers,
workers and React Native. The one exception is `canonicalHash`, which needs Web Crypto (`crypto.subtle`: Node,
browsers and workers; React Native only with a polyfill).

## Entry points

| Import             | Holds                        | Exports today                                                                                                                        |
| ------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `@stackra/support` | `src/core/`: isomorphic code | `time`, `Quantity`, `canonicalJson`, `canonicalHash`, `restrictedGtin`, `code128`; types `QuantityUnit`, `Rational`, `Code128Symbol` |

The package has the one entry `.` (ADR 0127, 2026-10-24 note). Entry barrels are generated, never authored
(ADR 0294 decision 15); until `stackra gen` writes them (STA-339) `src/core/index.ts` is a stand-in barrel.

## `time`

Fixed-length shifts of an instant, and calendar-month shifts with the day clamped to the month's end. Each helper takes a `Date` and an amount, returns a new `Date` and never mutates
its input. Units are exact lengths on the UTC timeline (a day is 86,400 s), so a daylight-saving change in a local
zone never stretches or shrinks a day.

```ts
import { time } from "@stackra/support";

const cutoff = time.subMinutes(ctx.now(), settings.autoCancelAfterMinutes);
const expiresAt = time.addDays(issuedAt, 30);
```

| Helper                     | Unit                 |
| -------------------------- | -------------------- |
| `addSeconds`, `subSeconds` | 1,000 ms             |
| `addMinutes`, `subMinutes` | 60 s                 |
| `addHours`, `subHours`     | 3,600 s              |
| `addDays`, `subDays`       | 86,400 s (a UTC day) |
| `addMonths`, `subMonths`   | a UTC calendar month |

- A negative amount shifts the other way; a fractional amount is truncated to whole milliseconds. A month amount
  must be a whole number.
- An invalid `Date` or a non-finite amount throws a `RangeError`, so `Invalid Date` never reaches a query.
- The helpers never read the clock: the current time comes from the caller (the `Clock` port of
  `@stackra/contracts`, or `ctx.now()` in an action).
- `addMonths` keeps the UTC time of day and clamps the day: 31 January plus one month is 28 (or 29) February. Shift
  each billing period from its fixed anchor (`addMonths(anchor, n)`), never from the previous result, or the day
  drifts (31 Jan, 28 Feb, 28 Mar). A period that starts on a local wall-clock date passes it as UTC midnight. Years
  are `addMonths(date, 12 * years)`.

## Canonical JSON and its hash

`canonicalJson(value)` writes one text per value: object keys sorted at every depth, `undefined` members dropped,
array order kept, dates as ISO 8601 UTC. `canonicalHash(value)` is the SHA-256 of that text as 64 lowercase hex. A
hash chain link, a signed checkpoint and a content address all use them, so writers and verifiers never drift; the
form is frozen (ADR 0416).

```ts
import { canonicalHash } from "@stackra/support";

const hash = await canonicalHash({ sequence, previousHash, ...record });
```

## `Quantity`

An amount with its unit, kept as a reduced fraction of big integers so conversion and arithmetic never round.

```ts
import { Quantity } from "@stackra/support";

Quantity.of("2.5", "yd").to("m").toDecimal(4); // "2.2860"
Quantity.of("1.5", "kg").ratio(Quantity.of(100, "g")); // { num: 15n, den: 1n }: the unit-price divisor
```

- Units: `mg`, `g`, `kg`, `oz`, `lb`; `mm`, `cm`, `m`, `in`, `ft`, `yd`; `ml`, `l`, `fl_oz` (US), `gal` (US);
  `piece`. Factors are the exact legal definitions (an inch is 0.0254 m).
- An amount is a decimal string, a safe integer or a big integer; a fractional `number` is refused.
- Units of different dimensions never mix (`TypeError`). Rounding happens once, in `toDecimal(places)`, half away
  from zero.
- Which unit a Market sells or shows in is market-pack data, never a default here.

## Barcodes

- `restrictedGtin(prefix, serial)`: a GTIN-13 under a GS1 restricted-circulation prefix (02, 04, 20 to 29) for a
  tenant with no GS1 company prefix. The prefix comes from the tenant's settings and the serial from its counter.
  Validating a GTIN is `@stackra/validation`'s job.
- `code128(data, { gs1 })`: symbol values and module widths, code set C for digit runs and B for text; with `gs1`, a
  leading FNC1 and FNC1 for each `\u001d` separator. Printable ASCII only; drawing is the caller's.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra/support`.

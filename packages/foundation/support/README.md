<!-- Purpose: the reader-facing guide to @stackra/support: what each helper does and how to call it. Boundary: packages/foundation/support only. Runtime: docs. Governing contract: ADR 0294, ADR 0305; STA-934; stackra-224. -->

# @stackra/support

Dependency-free pure helpers for Stackra packages and services, grown on demand. It holds `time`, `Quantity` (an
exact amount with a unit, rounded to a step or priced in minor units), `signedToken` (purpose-bound, expiring HMAC
tokens), `oneTimeCode` (single-use codes stored as a peppered HMAC), `canonicalJson` and `canonicalHash` (the one canonical form chains and signatures hash),
`restrictedGtin` (GS1 restricted-circulation numbers), `code128` (a Code 128 and GS1-128 encoder), the encoding
helpers `base64url`, `decodeBase64` and `crc32`, the markup helpers `escapeHtml`, `escapeXml` and `htmlToText`, the
guard `isRecord`, the case helpers `snakeCase`, `kebabCase`, `camelCase` and `pascalCase`, and `ageOn`. Every one has a
single home here: a package imports it and never keeps a copy (`tools/scripts/duplicate-exports.mjs` fails `pnpm
validate` on a second definition). Other string, array, async and object helpers are added when a package first needs
them, not before.

**Tier:** `tier:lib` (`packages/foundation/support`). Laid out in the programming model v3.1 (ADR 0294, 0305).
No workspace dependency, no runtime dependency, no host globals: it runs unchanged in Node, Encore, browsers,
workers and React Native. The one exception is Web Crypto, needed by `canonicalHash`, `signedToken` and `oneTimeCode`
(`crypto.subtle` and `crypto.getRandomValues`: Node, browsers and workers; React Native only with a polyfill).

## Entry points

| Import             | Holds                        | Exports today                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/support` | `src/core/`: isomorphic code | `time`, `Quantity`, `canonicalJson`, `canonicalHash`, `signedToken`, `oneTimeCode`, `restrictedGtin`, `code128`, `base64url`, `decodeBase64`, `crc32`, `escapeHtml`, `escapeXml`, `htmlToText`, `isRecord`, `snakeCase`, `kebabCase`, `camelCase`, `pascalCase`, `ageOn`; types `QuantityUnit`, `QuantityRounding`, `Rational`, `SigningKeySource`, `SignedTokenCheck`, `KeyedOneTimeCodeRecord`, `OneTimeCodeCheck`, `Code128Symbol` |

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
hash chain link, a signed checkpoint and a content address (`@stackra/market-packs`' pack hash, since stackra-224)
all use them, so writers and verifiers never drift; the form is frozen (ADR 0416).

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
- `roundTo(step, mode)` rounds to a whole multiple of a step (a scale's division: `1.237 kg` to `5 g` is `1.235 kg`);
  `priceMinor(pricePerMinor, per, mode)` prices the quantity in whole minor units (`1.235 kg` at `1299` per `1 kg` is
  `1604`). Modes are `half_up` (default, half away from zero), `down` and `up`. The step, the mode and the price come
  from settings or the market pack; money is a big integer, never a float.

## Signed tokens and one-time codes

Both take a `SigningKeySource`: pass the `KeyProvider` of `@stackra/contracts` (or any driver of it) as is. Both
use HMAC-SHA-256 with a domain prefix, so the same key never yields a token that verifies as a code.

```ts
import { oneTimeCode, signedToken, time } from "@stackra/support";

const token = await signedToken.sign(keys, {
  purpose: "receipt.view",
  expiresAt: time.addDays(ctx.now(), settings.receiptLinkDays),
  data: { receiptId },
});
const check = await signedToken.verify(keys, token, { purpose: "receipt.view", now: ctx.now() });

const { code, record } = await oneTimeCode.issue(keys, {
  purpose: "pickup",
  length: rules.codeLength,
  expiresAt: time.addMinutes(ctx.now(), rules.codeMinutes),
  maxAttempts: rules.codeAttempts,
});
const result = await oneTimeCode.verify(keys, record, typed, { purpose: "pickup", now: ctx.now() });
// store result.record with a compare-and-set on the record you read
```

- A token is `<key id>.<body>.<mac>` in base64url; the body is the canonical JSON of purpose, expiry and data. The
  data is signed, not encrypted: put an id in it, never a secret or personal data. `verify` never throws on a bad
  token; it returns `malformed`, `unknown_key`, `bad_signature`, `wrong_purpose` or `expired`.
- A one-time code is uniform random digits (4 to 12). Its record keeps only the HMAC, the key id, the expiry, the
  attempts left and `usedAt`; the code itself is returned once and never stored. `verify` compares in constant time,
  accepts a code at most once, spends an attempt on a miss and refuses a `used`, `expired` or `locked` record
  unchanged. Two concurrent verifies are made safe by the caller's compare-and-set.
- After a key rotation both still verify with the old key, found by id; a key that is gone gives `unknown_key`.

## Barcodes

- `restrictedGtin(prefix, serial)`: a GTIN-13 under a GS1 restricted-circulation prefix (02, 04, 20 to 29) for a
  tenant with no GS1 company prefix. The prefix comes from the tenant's settings and the serial from its counter.
  Validating a GTIN is `@stackra/validation`'s job.
- `code128(data, { gs1 })`: symbol values and module widths, code set C for digit runs and B for text; with `gs1`, a
  leading FNC1 and FNC1 for each `\u001d` separator. Printable ASCII only; drawing is the caller's.

## Encoding, markup, guards, case and age

One home each (stackra-224 moved the copies other packages kept here).

```ts
import {
  ageOn,
  base64url,
  crc32,
  escapeHtml,
  htmlToText,
  isRecord,
  kebabCase,
} from "@stackra/support";

const jwtPart = base64url.encode(new TextEncoder().encode(JSON.stringify(claims)));
const checksum = crc32(chunk, previous); // or crc32("text"), the UTF-8 bytes
const html = `<h1>${escapeHtml(props.title)}</h1>`;
const text = htmlToText(html);
if (isRecord(body) && isRecord(body.data)) read(body.data.id);
kebabCase("LoyaltyLedger"); // "loyalty-ledger"
ageOn(birthDate, today, pack.leapBirthday); // the 29 February rule is pack data
```

| Helper                                              | Does                                                                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base64url.encode`, `base64url.decode`              | unpadded URL-safe Base64 of bytes or an `ArrayBuffer`; `decode` accepts trailing `=` and throws a `RangeError` outside the alphabet               |
| `decodeBase64(text)`                                | standard Base64 to bytes, whitespace ignored; `undefined` for bad text (never throws), so the caller refuses with its own reason                  |
| `crc32(input, previous?)`                           | CRC-32 (IEEE) of bytes or a string's UTF-8 bytes, continued from an earlier chunk's value                                                         |
| `escapeHtml(value)`                                 | `& < > " '` as entities; `null` and `undefined` are `""`, anything else is `String(value)`                                                        |
| `escapeXml(value)`                                  | the five XML entities; a character XML 1.0 cannot carry (a control character) is a `TypeError`                                                    |
| `htmlToText(html)`                                  | the text part of rendered mail HTML: a blank line after each block, `<br>` as a line break, `label (href)` links, entities decoded                |
| `isRecord(value, keys?)`                            | a non-null, non-array object, and with `keys` one with no other own key                                                                           |
| `snakeCase`, `kebabCase`, `camelCase`, `pascalCase` | any naming form (Pascal, camel, kebab, dotted, spaced) to that case; digits stay with the word before them; an all-capitals run is one word       |
| `ageOn(birth, on, leapBirthday)`                    | whole years between two `YYYY-MM-DD` dates; a 29 February birthday counts on `february_28` or `march_1` in a common year, as the market pack says |

- `ageOn` has no default rule: the caller passes the market pack's value (`@stackra/calendar` re-exports it beside
  its `LeapBirthday` enum). It throws a `RangeError` for a date that is not `YYYY-MM-DD` or `on` before `birth`.
- `@stackra/coding-standard` keeps its own `kebabCase` and `pascalCase`: it has no workspace dependency by design, and
  its `kebabCase` splits acronym runs for file names. The duplicate-export check lists it as an intended copy.

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

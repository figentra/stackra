# @stackra/validation

Shapes and field rules for Stackra. A shape is a class: its field types are its rules, its initializers its defaults,
and a few typed field decorators refine it. `stackra gen` compiles each shape to one zod schema (`X$`) and registers it
here, so `validate(X, raw)` and `X.create(...)` find it. Authors write no zod except through `@Field(zod)`.

**Tier:** `tier:lib` (`packages/foundation/validation`). Entry `.` only (the old `./runtime` entry is folded in).
Depends on `@stackra/contracts`, `@stackra/container` and `zod`; one-time codes use Web Crypto. It absorbs the retired `@stackra/schema`.

## What is here

| Symbol                                                              | Use                                                                                |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Schema`                                                            | `class OrderView extends Schema { ... }`; `OrderView.create({ ... })`              |
| `CursorInput`, `TableInput`, `Page.of(X)`                           | list inputs and the cursor page output                                             |
| `PickType`, `OmitType`, `PartialType`                               | derive a shape from a shape                                                        |
| `Str`, `Int`, `Num`, `List`, `Trim`, `Field`                        | field rules, each typed against its field                                          |
| `Renamed`, `Classified`                                             | rename marker (class or field) and the privacy class of a field                    |
| `validate`, `schemaOf`, `registerSchemas`                           | check input; read a class's schema; the registry generated schemas fill            |
| `publicId`, `isoDateTime`, `json`, `url`, `duration`, `tableInput`  | the runtime helpers generated schemas and clients import                           |
| `Assert`, `Fields`, `Same`                                          | the types of each generated `X$Check`                                              |
| `FieldDecorator`, `ShapeClass`                                      | the types behind a field decorator and a derived shape class                       |
| `Address$`, `ScopeRef$`, `Actor$`, `Signature$`, `SignerPublicKey$` | the shipped schemas of `Address` and of the contracts types a shape field may name |

`Enum` is `@stackra/contracts`'; `money()` and `currencyCode()` are `@stackra/money`'s.

`@stackra/contracts` carries no zod, so the `X$` of its object types (`ScopeRef$`, `Actor$`, `Signature$`,
`SignerPublicKey$`) ships here. `Address$` is the market-neutral address; `address(format)` checks one Market's format
(STA-1284).

## Identifiers, phones, addresses and barcodes

Formats are market-pack data; this package holds the algorithms only, so no country is written in code.

| Symbol                                                        | Use                                                                                                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IdentifierFormat`, `IdentifierCheck`                         | a Market's pattern for a national ID, Iqama, Emirates ID, VAT or TRN, IBAN or postal code, and its check algorithm (`luhn`, `mod97`, `gs1`, `century_birth_date`) |
| `checkIdentifier(value, format)`, `identifier(format)`        | normalise (spaces, hyphens, Arabic-Indic digits, case) and check; the schema outputs the normalised value                                                         |
| `normalizeIdentifier`                                         | the normal form alone                                                                                                                                             |
| `e164()`, `E164`                                              | a phone number typed any common way, output as `+966500000001`                                                                                                    |
| `countryCode()`, `CountryCode`                                | ISO 3166-1 alpha-2, upper-cased, known to Intl                                                                                                                    |
| `address(format)`, `Address`, `AddressFormat`, `AddressField` | an address checked against its Market's required parts, line count, postal code and short address                                                                 |
| `gtin()`, `isGtin`, `gtinCheckDigit`                          | GTIN-8, UPC-A, EAN-13 and GTIN-14 check digits; the schema outputs GTIN-14 (conflict #1)                                                                          |

```ts
const vat = identifier(valueOf(pack, "identity.vat_number", today).value as IdentifierFormat);
vat.parse("3000 0000 0000 003");
```

## One-time codes

Issue and verify login, pickup and verification codes (conflict #2 puts them here).

```ts
const { code, record } = await issueOneTimeCode({
  purpose: "login",
  subject: userId,
  policy,
  pepper,
  now,
});
// deliver `code` once; store `record` (it holds a peppered HMAC, never the code)
const { result, record: next } = await verifyOneTimeCode({
  record,
  code: typed,
  policy,
  pepper,
  now,
});
// store `next` with a compare-and-set on `attempts`
```

- `policy` (`length`, `alphabet`, `ttlSeconds`, `maxAttempts`) is settings data; nothing is defaulted but the digit
  alphabet.
- The digest is HMAC-SHA-256 under the pepper over purpose, subject and code; compared in constant time
  (`constantTimeEqual`). Random digits come from Web Crypto without modulo bias.
- `OneTimeCodeResult`: `valid` (the record is spent), `invalid` (an attempt is counted), `expired`, `locked`.

## Shapes

```ts
import { CursorInput, Int, List, PickType, Schema, Str, validate } from "@stackra/validation";

export class CreateOrderInput extends Schema {
  @List({ min: 1, max: 100 })
  lines!: RequestedLine[];

  extensions: Record<string, Json> = {};
}

export class QuickOrderForm extends PickType(CreateOrderInput, ["lines"]) {
  @Int({ min: 0 })
  redeemPoints = 0;
}

const form = validate(QuickOrderForm, await ctx.formData());
if (!form.success) return ctx.fieldErrors(form.error);
```

A `number` carries `@Int` or `@Num`; `?:` is optional (absent, never `undefined`); `| null` is nullable. tsc refuses
`@Int` on a string, `@List` on a field that is not an array, and a `@Field(zod)` whose output the field cannot hold.
Decorators record only: gen reads them from source, and they never install an accessor.

## The registry

Each generated schemas file calls `registerSchemas([[Class, Class$], ...])`, and every generated entry loads those
files. The registry matches a class exactly: a subclass needs its own schema, so it never validates against its
parent's fields. A class with no schema throws a `TypeError` naming the fix. In a unit test, register a schema the same
way, or load the member's generated schemas through the generated vitest setup.

## Decisions

ADR 0294 (decisions 4, 6, 16, 25 and 26; amendment items 3 and 13), ADR 0095 as amended, ADR 0307 (resource tables),
the 2026-10-24 note on ADR 0127 (`Enum` in contracts, `./runtime` folded, money codecs in `@stackra/money`).

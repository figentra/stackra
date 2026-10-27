<!-- Purpose: the reader guide of @stackra/ledger: what is exported, the entry model, appends and floors, reversals, balanced postings, currency, extra fields, scope. Boundary: docs of packages/commerce/ledger only. Runtime: none (Markdown). Governing contract: ADR 0220; ADR 0294; STA-918. -->

# @stackra/ledger

Stackra ledger: the double-entry primitives every ledger shares, over an append-only entry model that the consumer owns
(ADR 0220). `Journal<M>` appends once per (account, reference), derives a balance from an account's entries, refuses a
debit below a balance floor, reverses entries set-wise and posts balanced multi-line entries.

**Tier:** `tier:lib` (`packages/commerce/ledger`). Entries `.` (the `@Journaled` facet, the refusal and the types, no database import) and `./node` (the
database-bound `Journal` and `journalOf`). Depends on `@stackra/container`,
`@stackra/contracts`, `@stackra/database`, `@stackra/errors`, `@stackra/locking` and `@stackra/model`.

## What is here

| Symbol                   | Entry    | Use                                                                                                              |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `Journal<M>`             | `./node` | `balance`, `find`, `append`, `reverseWhere`, `post` over the entry model `M`                                     |
| `@Journaled(options)`    | `.`      | class facet on the entry model: which fields hold account, amount, kind, reference, at, currency; `extra` fields |
| `journalOf(Model)`       | `./node` | the class token of `Journal<Model>`, as `repositoryOf(Model)` is `Repository<Model>`'s                           |
| `UnbalancedPostingError` | `.`      | `unbalanced_posting` (412): a posting's lines do not sum to zero, or are fewer than two                          |
| `JournalEntry<M>`        | `.`      | one movement in the journal's names; `kind` is the model's own kind type; `extra` typed by `M`                   |
| `JournalLine<M>`         | `.`      | one posting line, with the floor its account keeps                                                               |
| `JournalWrite`           | `.`      | `{ written, belowFloor }`, what an append or a posting did                                                       |
| `JournaledOptions`       | `.`      | the facet's field map and default floor                                                                          |

## The entry model

The journal owns no table. The consumer's model is the entry row: it carries `AppendOnly` (the journal refuses a model
without it), its scope or tenant trait, and a unique index over its scope column, account and reference, which is the
idempotency key. `@Journaled` maps the journal's names onto the model's fields; a model whose fields are already named
`account`, `amount`, `kind`, `reference` and `at` needs no facet.
`Journal` is imported from `@stackra/ledger/node`; `.` has no database import.

```ts
@Index(["tenantId", "memberId", "reference"], { unique: true })
@Journaled({ account: "memberId", amount: "points", floor: 0 })
export class LedgerEntry extends Model.with(HasPublicId("lpe"), BelongsToTenant, AppendOnly) {
  @Str({ max: 64 })
  memberId!: string;

  @Int({ min: -MAX_POINTS_PER_ENTRY, max: MAX_POINTS_PER_ENTRY })
  points!: number;

  kind!: EntryKind;

  @Str({ max: 120 })
  reference!: string;

  at!: Date;
}
```

A class injects `Journal<LedgerEntry>`; gen wires it as `journalOf(LedgerEntry)`, whose one dependency is `Locks`.

## Appending and the floor

```ts
const { written } = await journal.append({
  account,
  amount: 120,
  kind: EntryKind.Earn,
  reference: orderId,
  at,
});
const { written, belowFloor } = await journal.append(redeem, { floor: 0 });
```

- An append writes once per (account, reference); a repeat writes nothing and reports `written: false`.
- A write that lowers a balance holds the account's lock (`Locks`, a transaction-level advisory lock on Postgres), so
  concurrent debits of one account serialise and the second sees the first. It is refused, writing nothing, when it
  would leave the balance below the floor: the call's `floor`, else the model's default, and none with `floor: null`.
  A retried debit is reported as a duplicate, never as below the floor. A credit is never refused by a floor.
- Amounts are safe integers of points or minor units; a float is a `RangeError`.

## Reversals

```ts
const reversed = await journal.reverseWhere(
  { account: memberId, kind: EntryKind.Earn, before: cutoff },
  { kind: EntryKind.Expire, referencePrefix: "expire:", at: cutoff },
);
```

Every matching entry not yet reversed gets a reversal entry (the opposite amount, under the prefixed reference), oldest
first and in one locked step; a repeat reverses nothing more, and a reversal is never itself reversed. With a floor, a
reversal that lowers the balance is cut at the floor and the cut one is still written: an earn whose points were spent
expires only what is left, so a points balance never goes negative. The result lists the entries reversed, each with
the part that was reversed.

## Balanced postings

```ts
await journal.post([
  { account: "issued", amount: -120, kind: EntryKind.Earn, reference: orderId, at, floor: null },
  { account: memberId, amount: 120, kind: EntryKind.Earn, reference: orderId, at },
]);
```

The lines sum to zero and are at least two (`UnbalancedPostingError` otherwise); every line is written or none; a
posting with a line already applied is a duplicate. Each account the posting lowers keeps its line's floor, so a counter
account lifts it with `floor: null` while the party's account keeps the model's.

`journal.lines(reference)` reads a posting's lines back, on every account, in the order written (empty when none was),
so a retried top-up is known as a duplicate before its cap is checked.

## Currency

A money journal names a `currency` field in the facet: `@Journaled({ currency: "currency", floor: 0 })`. Then every entry
carries an ISO 4217 code (`EUR`; a missing or malformed one is a `RangeError`), every posting's lines share one currency
(`UnbalancedPostingError` with `currencies` otherwise), and `balance({ account, currency })` sums per currency, as do
the floor checks and reversals. A model with no `currency` field is single-unit (points): it takes no currency, and a
currency on its entry is a `TypeError`.

## Extra fields

A journal whose rows carry more than its own five fields lists them in the facet, and each entry fills them in
`extra`, typed by the model:

```ts
@Journaled({ account: "variantId", amount: "quantity", extra: ["locationId", "lotId", "unitCostMinor"] })
export class StockMovement extends Model.with(HasPublicId("smv"), AppendOnly) { ... }

await journal.append({ account: variantId, amount: 12, kind, reference: receiptId, at, extra: { locationId, lotId } });
```

`find`, `lines` and `reverseWhere` return the listed fields that hold a value in `extra`, and a reversal is written
with its original's extra fields. An `extra` key the facet does not list is a `TypeError` before anything is written;
the facet refuses an extra name that repeats one of the journal's own fields. Balances and floors stay per account
(and currency): an extra field is carried, never summed by.

## Scope and isolation

The journal runs in the caller's transaction and scope session and adds no filter: the entry table's own row-level
security (`t.belongsToTenant()` or `t.scopeId()`, chosen by the consumer's model) isolates the rows. Lock keys name the
model and the account only; two scopes sharing an account string share a lock, never rows.

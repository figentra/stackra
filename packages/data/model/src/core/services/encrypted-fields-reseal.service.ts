/**
 * Stackra file contract:
 * Purpose: `EncryptedFieldsResealService`, the key re-seal job and key-usage report of `HasEncryptedFields`: `usage`
 *          counts a model's sealed values per data key, and `reseal` opens every value still under an older key and
 *          seals it again under the current one, a page at a time with a cursor, so key rotation finishes and an old
 *          key can be retired once no row names it.
 * Boundary: works on the sealed form, below the unit of work: it reads raw rows with the ORM driver (no hydration, no
 *           `onLoad`, no query filter, so soft-deleted and archived rows are covered) and writes each re-sealed row
 *           with the driver's `nativeUpdate`, guarded by the old sealed values, so a row a write changed in between is
 *           skipped, never clobbered (a later run picks it up). Both run in the caller's transaction context, which
 *           sets the scope; outside one, row-level security shows no scoped row. Values are opened and sealed in the
 *           same `<model key>.<field>` context as `EncryptedFieldsSubscriber`, with the scope's `FieldCipher` or, for a
 *           `HasEncryptedFields({ subject })` model, the subject's cipher from `SubjectCipherResolver`; a row of an
 *           erased subject is skipped (it is shredded). The current key is the scope `KeyProvider`'s; a subject's key
 *           keeps that id. A single-column primary key only. The cursor is the raw primary key of the last row read;
 *           the caller stores it (the import-ledger pattern) to resume. Registering it as a queued job per model is
 *           the host's (gen's) wiring; this package ships the work. A `lookup` field's blind index is rewritten with
 *           its value, and a row whose index is missing (written before the field kept one) or made under another key
 *           counts as stale, so a run also backfills and rotates the indexes `whereEncrypted` matches.
 * Runtime: node
 * Governing contract: ADR 0188 (decision 2); ADR 0212; ADR 0294 (decisions 16 and 17); ADR 0367 (decisions 7 to 9);
 *                     ADR 0465 (decision 5: a re-seal job before any merge of the two encryption paths); gap gov7
 *                     (stackra-312); gap gov9 (stackra-313).
 */
import type { EntityManager, EntityMetadata, EntityProperty } from "@mikro-orm/core";
import { Service } from "@stackra/container";
import type { FieldCipher, KeyProvider } from "@stackra/contracts";

import { blindIndexOf } from "#core/functions/blind-index-of.function";
import { blindIndexProperty } from "#core/functions/blind-index-property.function";
import { encryptedFieldContext } from "#core/functions/encrypted-field-context.function";
import { encryptedFieldsOf } from "#core/functions/encrypted-fields-of.function";
import { encryptedLookupOf } from "#core/functions/encrypted-lookup-of.function";
import { encryptedSubjectOf } from "#core/functions/encrypted-subject-of.function";
import { sealedKeyId } from "#core/functions/sealed-key-id.function";
import type { SubjectCipherResolver } from "#core/ports/subject-cipher-resolver.port";
import type { KeyUsage } from "#core/types/key-usage.type";
import type { ResealOptions } from "#core/types/reseal-options.type";
import type { ResealStep } from "#core/types/reseal-step.type";

/** Rows read per page when the caller names no limit. */
const PAGE = 500;

/** A raw row as the driver reads it, keyed by property name. */
type Row = Record<string, unknown>;

/** The parts of a model's metadata a step needs. */
interface Plan {
  readonly meta: EntityMetadata<object>;
  readonly key: string;
  readonly fields: readonly string[];
  readonly subject: string | undefined;
  readonly lookup: readonly string[];
}

/**
 * Re-seals a model's encrypted fields under the current key and reports key usage.
 *
 * @example
 * const job = new EncryptedFieldsResealService(cipher, keys, subjects);
 * let after = ledger.cursor;
 * do ({ cursor: after } = await job.reseal(em, Contact, { after })); while (after !== null);
 */
export class EncryptedFieldsResealService extends Service {
  /** The scope's cipher. */
  private readonly cipher: FieldCipher;

  /** The scope's keys, for the current key's id. */
  private readonly keys: KeyProvider;

  /** The per-subject ciphers; absent when the host binds none. */
  private readonly subjects: SubjectCipherResolver | undefined;

  /**
   * @param cipher - the scope's cipher, the one `EncryptedFieldsSubscriber` is built with.
   * @param keys - the scope's key provider that cipher seals with.
   * @param subjects - the per-subject ciphers, needed once any model is `HasEncryptedFields({ subject })`.
   */
  constructor(cipher: FieldCipher, keys: KeyProvider, subjects?: SubjectCipherResolver) {
    super();
    this.cipher = cipher;
    this.keys = keys;
    this.subjects = subjects;
  }

  /**
   * Counts `type`'s sealed values per key over every row.
   *
   * @throws TypeError when `type` has no encrypted fields, a composite primary key, or a value not in the sealed form.
   */
  async usage(em: EntityManager, type: object): Promise<KeyUsage> {
    const plan = this.plan(em, type);
    const { id: current } = await this.keys.current();
    const keys: Record<string, number> = {};
    let rows = 0;
    let stale = 0;
    let after: string | number | null | undefined;
    for (;;) {
      const page = await this.page(em, plan, after, PAGE);
      for (const row of page) {
        for (const field of plan.fields) {
          const id = this.keyOf(plan, row, field);
          if (id !== undefined) keys[id] = (keys[id] ?? 0) + 1;
        }
        if (this.staleFields(plan, row, current).length > 0) stale += 1;
      }
      rows += page.length;
      after = this.cursorOf(plan, page, PAGE);
      if (after === null) return { current, rows, keys, stale };
    }
  }

  /**
   * Re-seals the rows of one page whose values are not all under the current key.
   *
   * @throws TypeError when `type` has no encrypted fields or a composite primary key, `limit` is not a positive
   *         integer, a value is not in the sealed form, or a subject-sealed row has no subject id or no resolver is
   *         bound; the cipher's error when a value does not open in its context.
   */
  async reseal(em: EntityManager, type: object, options: ResealOptions = {}): Promise<ResealStep> {
    const limit = options.limit ?? PAGE;
    if (!Number.isInteger(limit) || limit < 1)
      throw new TypeError(`A re-seal step reads a positive whole number of rows, got ${limit}`);
    const plan = this.plan(em, type);
    const { id: current } = await this.keys.current();
    const page = await this.page(em, plan, options.after, limit);
    let resealed = 0;
    let skipped = 0;
    for (const row of page) {
      const stale = this.staleFields(plan, row, current);
      if (stale.length === 0) continue;
      if (await this.resealRow(em, plan, row, stale)) resealed += 1;
      else skipped += 1;
    }
    return { scanned: page.length, resealed, skipped, cursor: this.cursorOf(plan, page, limit) };
  }

  /**
   * Opens and seals again `fields` of one row and writes them if the row still holds what was read.
   *
   * @returns false when the subject was erased or a write changed the row first.
   */
  private async resealRow(
    em: EntityManager,
    plan: Plan,
    row: Row,
    fields: readonly string[],
  ): Promise<boolean> {
    const ciphers = await this.ciphersOf(em, plan, row);
    if (ciphers === undefined) return false;
    const where: Row = { [plan.key]: row[plan.key] };
    const data: Row = {};
    for (const field of fields) {
      const sealed = row[field] as string;
      const context = encryptedFieldContext(plan.meta, field);
      const plain = await ciphers.opening.open(sealed, context);
      data[field] = await ciphers.sealing.seal(plain, context);
      where[field] = sealed;
      if (plan.lookup.includes(field))
        data[blindIndexProperty(field)] = await blindIndexOf(this.keys, plain, context);
    }
    const result = await em
      .getDriver()
      .nativeUpdate(plan.meta.class, where as never, data as never, {
        ctx: em.getTransactionContext(),
      });
    return result.affectedRows > 0;
  }

  /**
   * The ciphers that open and seal one row: the scope's, or its subject's.
   *
   * @returns undefined when the row's subject was erased.
   * @throws TypeError when the subject property holds no id, or no resolver is bound.
   */
  private async ciphersOf(
    em: EntityManager,
    plan: Plan,
    row: Row,
  ): Promise<{ readonly opening: FieldCipher; readonly sealing: FieldCipher } | undefined> {
    if (plan.subject === undefined) return { opening: this.cipher, sealing: this.cipher };
    const property = (plan.meta.properties as Record<string, EntityProperty<object> | undefined>)[
      plan.subject
    ];
    const raw = row[plan.subject];
    // the subscriber keys a subject by the property's JS value, so a custom-typed id (a public id) is converted back
    const subject =
      property?.customType === undefined
        ? raw
        : property.customType.convertToJSValue(raw, em.getPlatform());
    if (typeof subject !== "string" || subject === "")
      throw new TypeError(
        `${plan.meta.className}.${plan.subject} names the subject its encrypted fields are sealed for, so it must hold an id`,
      );
    if (this.subjects === undefined)
      throw new TypeError(
        `${plan.meta.className} is sealed per subject, so EncryptedFieldsResealService needs a SubjectCipherResolver`,
      );
    const opening = await this.subjects.opening(subject);
    if (opening === undefined) return undefined;
    return { opening, sealing: await this.subjects.sealing(subject) };
  }

  /**
   * The fields of a row to re-seal: a value off the current key, or a lookup field whose blind index is missing or
   * was made under another key.
   */
  private staleFields(plan: Plan, row: Row, current: string): readonly string[] {
    return plan.fields.filter((field) => {
      const id = this.keyOf(plan, row, field);
      if (id === undefined) return false;
      if (id !== current) return true;
      if (!plan.lookup.includes(field)) return false;
      const index = row[blindIndexProperty(field)];
      return typeof index !== "string" || index.slice(0, index.lastIndexOf(".")) !== current;
    });
  }

  /**
   * The key id of one value of a row.
   *
   * @returns undefined for a null value.
   * @throws TypeError when the value is not in the sealed form.
   */
  private keyOf(plan: Plan, row: Row, field: string): string | undefined {
    const value = row[field];
    if (value === null || value === undefined) return undefined;
    const id = typeof value === "string" ? sealedKeyId(value) : undefined;
    if (id === undefined)
      throw new TypeError(
        `${plan.meta.className}.${field} holds a value that is not sealed, so it cannot be re-sealed`,
      );
    return id;
  }

  /** One page of raw rows after `after`, in primary-key order: the key, the encrypted fields and the subject. */
  private page(
    em: EntityManager,
    plan: Plan,
    after: string | number | null | undefined,
    limit: number,
  ): Promise<Row[]> {
    const fields = [
      plan.key,
      ...plan.fields,
      ...plan.lookup.map(blindIndexProperty),
      ...(plan.subject === undefined ? [] : [plan.subject]),
    ];
    const where = after === undefined || after === null ? {} : { [plan.key]: { $gt: after } };
    // the model's own type is erased here, so the driver's typed options are passed through `never`
    return em.getDriver().find(plan.meta.class, where as never, {
      fields: fields as never,
      orderBy: { [plan.key]: "asc" } as never,
      limit,
      ctx: em.getTransactionContext(),
    }) as Promise<Row[]>;
  }

  /** The next step's cursor: the last row's key, or null when the page was short (the table is done). */
  private cursorOf(plan: Plan, page: readonly Row[], limit: number): string | number | null {
    if (page.length < limit) return null;
    return page.at(-1)?.[plan.key] as string | number;
  }

  /**
   * What a step of `type` reads.
   *
   * @throws TypeError when `type` has no encrypted fields or no single-column primary key.
   */
  private plan(em: EntityManager, type: object): Plan {
    const fields = encryptedFieldsOf(type);
    const meta = em.getMetadata(type as never) as EntityMetadata<object>;
    if (fields.length === 0)
      throw new TypeError(`${meta.className} has no encrypted fields to re-seal`);
    const [key, ...rest] = meta.primaryKeys as readonly string[];
    if (key === undefined || rest.length > 0)
      throw new TypeError(`${meta.className} needs a single-column primary key to be re-sealed`);
    return {
      meta,
      key,
      fields,
      subject: encryptedSubjectOf(type),
      lookup: encryptedLookupOf(type),
    };
  }
}

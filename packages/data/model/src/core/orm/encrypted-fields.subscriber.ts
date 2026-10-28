/**
 * Stackra file contract:
 * Purpose: `EncryptedFieldsSubscriber`, the ORM subscriber behind `HasEncryptedFields`: it seals a model's encrypted
 *          fields with the `FieldCipher` port just before a create, an update or an upsert writes them, gives the model
 *          its plain text back once the write lands, and opens them when a row loads, so the table holds only the
 *          sealed form and code only ever sees plain text.
 * Boundary: passed as one of `DatabaseOptions.subscribers`; registering it in the generated boot, with the host's
 *           `FieldCipher` binding, is gen's (STA-339). Each value is bound to the context `<model key>.<field>`, the
 *           model key derived from the entity metadata as gen derives it (`<schema>.<snake(Class)>`), so a sealed value
 *           opens only in its own column; an entity without a module schema is refused rather than written in clear. A
 *           null (or an unloaded field) stays as it is; any other value that is not a string is refused. An update
 *           seals only the fields it writes. The ORM's snapshot of each field is moved to the plain text, so an
 *           unchanged field never looks dirty. Writes that bypass the unit of work (`nativeInsert`, `nativeUpdate`, the
 *           query builder, raw SQL) fire no entity event and are not sealed. After a flush fails, the model keeps the
 *           sealed values until a later write of it lands; that write does not seal them twice. A model with
 *           `HasEncryptedFields({ subject })` is sealed and opened with the `SubjectCipherResolver`'s cipher of the
 *           subject its subject property names (the property must hold an id, or the write or load is refused); an
 *           update that changes the subject seals every encrypted field again, under the new subject. A field whose
 *           subject was erased (no salt left) loads as null. Without a resolver such a model is refused rather than
 *           sealed under the scope's key, which would make a later shred a false erasure.
 * Runtime: node
 * Governing contract: ADR 0096 (decision 4: traits run as ORM subscribers); ADR 0097 (decision 4); ADR 0294
 *                     (decisions 20 and 27); ADR 0173; ADR 0188 (decision 2); ADR 0212; registry gap R-36 (owner
 *                     decision 23); gap gov2 (stackra-263).
 */
import type { EventArgs, EventSubscriber } from "@mikro-orm/core";
import { wrap } from "@mikro-orm/core";
import type { FieldCipher } from "@stackra/contracts";

import { encryptedFieldsOf } from "#core/functions/encrypted-fields-of.function";
import { encryptedSubjectOf } from "#core/functions/encrypted-subject-of.function";
import type { SubjectCipherResolver } from "#core/ports/subject-cipher-resolver.port";

/** A module key, which a model's Postgres schema is (ADR 0294 decision 20). */
const MODULE_KEY = /^[a-z][a-z0-9_]*$/;

/**
 * Seals and opens the fields models name with `HasEncryptedFields`.
 *
 * @example
 * const database = await PostgresDatabaseDriver.connect({ url, subscribers: [new EncryptedFieldsSubscriber(cipher, subjects)] });
 */
export class EncryptedFieldsSubscriber implements EventSubscriber<object> {
  /** Seals and opens each value. */
  private readonly cipher: FieldCipher;

  /** Hands out the cipher of one subject, for a model sealed per subject; absent when the host binds none. */
  private readonly subjects: SubjectCipherResolver | undefined;

  /** Per entity, each field this subscriber sealed: its plain text and the sealed value it wrote in its place. */
  private readonly written = new WeakMap<object, Map<string, readonly [string, string]>>();

  /**
   * @param cipher - the cipher the host binds, a KMS-backed driver in production.
   * @param subjects - the per-subject ciphers, needed once any model is `HasEncryptedFields({ subject })`.
   */
  constructor(cipher: FieldCipher, subjects?: SubjectCipherResolver) {
    this.cipher = cipher;
    this.subjects = subjects;
  }

  /** The ORM's `beforeCreate`: seals every encrypted field the new row holds. */
  async beforeCreate(args: EventArgs<object>): Promise<void> {
    await this.seal(args, encryptedFieldsOf(args.meta.class));
  }

  /** The ORM's `beforeUpdate`: seals the encrypted fields the update writes, or all of them when the subject changes. */
  async beforeUpdate(args: EventArgs<object>): Promise<void> {
    const payload: object = args.changeSet?.payload ?? {};
    const fields = encryptedFieldsOf(args.meta.class);
    const subject = encryptedSubjectOf(args.meta.class);
    await this.seal(
      args,
      subject !== undefined && subject in payload
        ? fields
        : fields.filter((field) => field in payload),
    );
  }

  /** The ORM's `beforeUpsert`: seals every encrypted field of the entity or data being upserted. */
  async beforeUpsert(args: EventArgs<object>): Promise<void> {
    await this.seal(args, encryptedFieldsOf(args.meta.class));
  }

  /** The ORM's `afterCreate`: gives the model back its plain text. */
  afterCreate(args: EventArgs<object>): void {
    this.restore(args.entity);
  }

  /** The ORM's `afterUpdate`: gives the model back its plain text. */
  afterUpdate(args: EventArgs<object>): void {
    this.restore(args.entity);
  }

  /** The ORM's `afterUpsert`: gives back what this subscriber sealed and opens what the row returned sealed. */
  async afterUpsert(args: EventArgs<object>): Promise<void> {
    const restored = this.restore(args.entity);
    await this.open(
      args,
      encryptedFieldsOf(args.meta.class).filter((field) => !restored.has(field)),
    );
  }

  /** The ORM's `onLoad`: opens the encrypted fields of a loaded row. */
  async onLoad(args: EventArgs<object>): Promise<void> {
    await this.open(args, encryptedFieldsOf(args.meta.class));
  }

  /**
   * Seals `fields` of the entity in place, remembering each plain text.
   *
   * @throws TypeError when a field holds a value that is neither a string nor null; the cipher's error.
   */
  private async seal(
    { entity, meta }: EventArgs<object>,
    fields: readonly string[],
  ): Promise<void> {
    if (fields.length === 0) return;
    const record = entity as Record<string, unknown>;
    const written = this.written.get(entity) ?? new Map<string, readonly [string, string]>();
    let cipher: FieldCipher | undefined;
    for (const field of fields) {
      const value = record[field];
      // the second test skips a value this subscriber already sealed, left in place by a flush that failed
      if (value === null || value === undefined || written.get(field)?.[1] === value) continue;
      if (typeof value !== "string")
        throw new TypeError(`${meta.className}.${field} is encrypted, so it must hold a string`);
      // resolved once per row and only when a value is sealed, so a row of nulls creates no subject salt
      cipher ??= await this.sealingCipher(entity, meta);
      const sealed = await cipher.seal(value, this.contextOf(meta, field));
      written.set(field, [value, sealed]);
      record[field] = sealed;
    }
    if (written.size > 0) this.written.set(entity, written);
  }

  /** Puts back the plain text of each field this subscriber sealed and that still holds its sealed value. */
  private restore(entity: object): ReadonlySet<string> {
    const written = this.written.get(entity);
    this.written.delete(entity);
    const record = entity as Record<string, unknown>;
    const restored = new Set<string>();
    for (const [field, [plain, sealed]] of written ?? []) {
      if (record[field] !== sealed) continue;
      record[field] = plain;
      this.snapshot(entity, field, plain);
      restored.add(field);
    }
    return restored;
  }

  /**
   * Opens the sealed string `fields` of the entity in place.
   *
   * @throws the cipher's error when a value does not open in its context.
   */
  private async open(
    { entity, meta }: EventArgs<object>,
    fields: readonly string[],
  ): Promise<void> {
    const record = entity as Record<string, unknown>;
    let cipher: FieldCipher | null | undefined;
    for (const field of fields) {
      const value = record[field];
      if (typeof value !== "string") continue;
      // null: the subject was erased, so the field is shredded and reads as null
      cipher ??= (await this.openingCipher(entity, meta)) ?? null;
      const plain = cipher === null ? null : await cipher.open(value, this.contextOf(meta, field));
      record[field] = plain;
      this.snapshot(entity, field, plain);
    }
  }

  /** The cipher that seals this row: the scope's, or its subject's (creating the subject's salt). */
  private async sealingCipher(
    entity: object,
    meta: EventArgs<object>["meta"],
  ): Promise<FieldCipher> {
    const subject = this.subjectOf(entity, meta);
    if (subject === undefined) return this.cipher;
    return this.resolver(meta).sealing(subject);
  }

  /** The cipher that opens this row: the scope's, or its subject's; undefined once the subject is erased. */
  private async openingCipher(
    entity: object,
    meta: EventArgs<object>["meta"],
  ): Promise<FieldCipher | undefined> {
    const subject = this.subjectOf(entity, meta);
    if (subject === undefined) return this.cipher;
    return this.resolver(meta).opening(subject);
  }

  /**
   * The subject id of a subject-sealed row; undefined for a model sealed under the scope's key.
   *
   * @throws TypeError when the subject property holds no id.
   */
  private subjectOf(entity: object, meta: EventArgs<object>["meta"]): string | undefined {
    const property = encryptedSubjectOf(meta.class);
    if (property === undefined) return undefined;
    const subject = (entity as Record<string, unknown>)[property];
    if (typeof subject !== "string" || subject === "")
      throw new TypeError(
        `${meta.className}.${property} names the subject its encrypted fields are sealed for, so it must hold an id`,
      );
    return subject;
  }

  /**
   * The bound resolver.
   *
   * @throws TypeError when none is bound, rather than sealing a subject's fields under the scope's key.
   */
  private resolver(meta: EventArgs<object>["meta"]): SubjectCipherResolver {
    if (this.subjects === undefined)
      throw new TypeError(
        `${meta.className} is sealed per subject, so EncryptedFieldsSubscriber needs a SubjectCipherResolver`,
      );
    return this.subjects;
  }

  /** Moves the ORM's snapshot of `field` to its plain text, so the next flush compares plain with plain. */
  private snapshot(entity: object, field: string, plain: string | null): void {
    // oxlint-disable-next-line no-underscore-dangle -- MikroORM's own name for the entity snapshot
    const original = wrap(entity, true).__originalEntityData as Record<string, unknown> | undefined;
    if (original !== undefined) original[field] = plain;
  }

  /**
   * The cipher context of `field`: `<model key>.<field>`.
   *
   * @throws TypeError when the entity has no module schema to derive its model key from.
   */
  private contextOf(meta: EventArgs<object>["meta"], field: string): string {
    const schema = meta.schema;
    if (schema === undefined || !MODULE_KEY.test(schema))
      throw new TypeError(
        `${meta.className} has no module schema, so its encrypted fields have no cipher context`,
      );
    // the same snake_case gen's `modelKey` gives a class name
    const model = meta.className.replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
    return `${schema}.${model}.${field}`;
  }
}

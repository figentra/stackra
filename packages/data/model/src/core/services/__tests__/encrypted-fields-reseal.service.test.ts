/**
 * Stackra file contract:
 * Purpose: unit tests of `EncryptedFieldsResealService`: `usage` counts sealed values per key over every page and the
 *          rows off the current key; `reseal` re-seals only the stale values of a page under the current key in the
 *          same context, guards the write with the old values, skips a row a write changed first and a row of an
 *          erased subject, converts a custom-typed subject, returns a cursor that resumes, and refuses a model
 *          without encrypted fields, a composite key, an unsealed value, a bad limit, and a subject-sealed model
 *          without a resolver. A lookup field's blind index is rewritten with its value, and a missing or rotated
 *          index makes a row stale even when its value is on the current key. A scope-bound row is re-sealed in its
 *          `@<scope id>` context, and one without a scope id is refused.
 * Boundary: test only; a stand-in entity manager whose driver pages an in-memory table by primary key, and an
 *           in-test cipher that writes the `v1.<keyId>.<iv>.<body>` form reversibly, not a cipher.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0465 (decision 5); gap gov7 (stackra-312); gap gov8 (stackra-330); ADR 0476.
 */
import type { EntityManager } from "@mikro-orm/core";
import { FieldCipher, KeyProvider } from "@stackra/contracts";
import type { DataKey } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { blindIndexOf } from "#core/functions/blind-index-of.function";
import { SubjectCipherResolver } from "#core/ports/subject-cipher-resolver.port";
import { EncryptedFieldsResealService } from "#core/services/encrypted-fields-reseal.service";
import { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";

/** Hands out a current key id that a test can rotate. */
class RotatingKeys extends KeyProvider {
  id = "k2";

  override async current(): Promise<DataKey> {
    return { id: this.id, key: new Uint8Array(32) };
  }

  override async byId(id: string): Promise<DataKey> {
    return { id, key: new Uint8Array(32) };
  }
}

/** Seals as `v1.<key>.<tag>.<base64url(context|plain)>`; opens only in the same context and with the same tag. */
class FormCipher extends FieldCipher {
  private readonly keys: RotatingKeys;

  private readonly tag: string;

  constructor(keys: RotatingKeys, tag = "iv") {
    super();
    this.keys = keys;
    this.tag = tag;
  }

  override async seal(plain: string, context: string): Promise<string> {
    return [
      "v1",
      this.keys.id,
      this.tag,
      Buffer.from(`${context}|${plain}`).toString("base64url"),
    ].join(".");
  }

  override async open(sealed: string, context: string): Promise<string> {
    const [, , tag, body = ""] = sealed.split(".");
    const [bound, plain] = Buffer.from(body, "base64url").toString().split("|");
    if (tag !== this.tag || bound !== context || plain === undefined)
      throw new Error("Cannot open");
    return plain;
  }
}

class Contact extends Model.with(HasEncryptedFields("email", "phone")) {
  id!: string;

  email: string | null = null;

  phone: string | null = null;
}

class Profile extends Model.with(HasEncryptedFields({ subject: "userId" }, "email")) {
  id!: string;

  userId!: string;

  email: string | null = null;
}

class Lead extends Model.with(HasEncryptedFields({ lookup: ["email"] }, "email")) {
  id!: string;

  email: string | null = null;

  emailBidx: string | null = null;
}

class Message extends Model.with(HasEncryptedFields({ scope: "scopeId" }, "content")) {
  id!: string;

  scopeId!: string;

  content!: string;
}

class Note extends Model {
  id!: string;
}

type Row = Record<string, unknown>;

/** A stand-in entity manager over `rows` of `type`; `race` changes a row between the read and the write. */
function managerOf(
  type: { name: string },
  rows: Row[],
  options: { primaryKeys?: string[]; race?: (row: Row) => void; customType?: object } = {},
): { em: EntityManager; updates: { where: Row; data: Row }[] } {
  const updates: { where: Row; data: Row }[] = [];
  const meta = {
    class: type,
    className: type.name,
    schema: "crm",
    primaryKeys: options.primaryKeys ?? ["id"],
    properties: { userId: { customType: options.customType } },
  };
  const driver = {
    async find(
      _: unknown,
      where: { id?: { $gt: string } },
      find: { limit: number; fields: string[] },
    ) {
      const after = where.id?.$gt;
      const page = rows
        .filter((row) => after === undefined || (row["id"] as string) > after)
        .sort((a, b) => ((a["id"] as string) < (b["id"] as string) ? -1 : 1))
        .slice(0, find.limit)
        .map((row) => Object.fromEntries(find.fields.map((field) => [field, row[field]])));
      for (const row of rows) options.race?.(row);
      return page;
    },
    async nativeUpdate(_: unknown, where: Row, data: Row) {
      updates.push({ where, data });
      const row = rows.find((candidate) =>
        Object.entries(where).every(([key, value]) => candidate[key] === value),
      );
      if (row !== undefined) Object.assign(row, data);
      return { affectedRows: row === undefined ? 0 : 1 };
    },
  };
  const em = {
    getMetadata: () => meta,
    getDriver: () => driver,
    getTransactionContext: () => undefined,
    getPlatform: () => ({}),
  } as unknown as EntityManager;
  return { em, updates };
}

/** Seals `plain` for `field` of the contact under key `key`. */
async function sealedFor(
  keys: RotatingKeys,
  key: string,
  field: string,
  plain: string,
  model = "contact",
): Promise<string> {
  const current = keys.id;
  keys.id = key;
  const value = await new FormCipher(keys).seal(plain, `crm.${model}.${field}`);
  keys.id = current;
  return value;
}

describe(EncryptedFieldsResealService, () => {
  it("reports the values per key and the rows off the current key over every page", async () => {
    const keys = new RotatingKeys();
    const rows = [
      { id: "a", email: await sealedFor(keys, "k1", "email", "a@x.io"), phone: null },
      {
        id: "b",
        email: await sealedFor(keys, "k2", "email", "b@x.io"),
        phone: await sealedFor(keys, "k1", "phone", "1"),
      },
      { id: "c", email: await sealedFor(keys, "k2", "email", "c@x.io"), phone: null },
    ];
    const { em } = managerOf(Contact, rows);
    const service = new EncryptedFieldsResealService(new FormCipher(keys), keys);

    expect(await service.usage(em, Contact)).toEqual({
      current: "k2",
      rows: 3,
      keys: { k1: 2, k2: 2 },
      stale: 2,
    });
  });

  it("re-seals only the stale values under the current key, guarded by the old values", async () => {
    const keys = new RotatingKeys();
    const oldEmail = await sealedFor(keys, "k1", "email", "a@x.io");
    const freshPhone = await sealedFor(keys, "k2", "phone", "1");
    const rows: Row[] = [
      { id: "a", email: oldEmail, phone: freshPhone },
      { id: "b", email: await sealedFor(keys, "k2", "email", "b@x.io"), phone: null },
    ];
    const { em, updates } = managerOf(Contact, rows);
    const cipher = new FormCipher(keys);
    const service = new EncryptedFieldsResealService(cipher, keys);

    expect(await service.reseal(em, Contact)).toEqual({
      scanned: 2,
      resealed: 1,
      skipped: 0,
      cursor: null,
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]?.where).toEqual({ id: "a", email: oldEmail });
    expect(Object.keys(updates[0]?.data ?? {})).toEqual(["email"]);
    expect(rows[0]?.["email"]).toMatch(/^v1\.k2\./);
    expect(await cipher.open(rows[0]?.["email"] as string, "crm.contact.email")).toBe("a@x.io");
    expect(rows[0]?.["phone"]).toBe(freshPhone);
    expect((await service.usage(em, Contact)).stale).toBe(0);
  });

  it("returns a cursor that resumes after the last row read", async () => {
    const keys = new RotatingKeys();
    const rows: Row[] = [];
    for (const id of ["a", "b", "c"])
      rows.push({ id, email: await sealedFor(keys, "k1", "email", id), phone: null });
    const { em } = managerOf(Contact, rows);
    const service = new EncryptedFieldsResealService(new FormCipher(keys), keys);

    const first = await service.reseal(em, Contact, { limit: 2 });
    expect(first).toEqual({ scanned: 2, resealed: 2, skipped: 0, cursor: "b" });
    expect(
      await service.reseal(em, Contact, { after: first.cursor ?? undefined, limit: 2 }),
    ).toEqual({
      scanned: 1,
      resealed: 1,
      skipped: 0,
      cursor: null,
    });
  });

  it("skips a row a write changed between the read and the write", async () => {
    const keys = new RotatingKeys();
    const rows: Row[] = [
      { id: "a", email: await sealedFor(keys, "k1", "email", "a@x.io"), phone: null },
    ];
    const changed = await sealedFor(keys, "k2", "email", "new@x.io");
    const { em } = managerOf(Contact, rows, { race: (row) => (row["email"] = changed) });
    const service = new EncryptedFieldsResealService(new FormCipher(keys), keys);

    expect(await service.reseal(em, Contact)).toEqual({
      scanned: 1,
      resealed: 0,
      skipped: 1,
      cursor: null,
    });
    expect(rows[0]?.["email"]).toBe(changed);
  });

  it("re-seals a subject-sealed row with its subject's cipher and skips an erased subject", async () => {
    const keys = new RotatingKeys();
    const resolver = new (class extends SubjectCipherResolver {
      override async sealing(subject: string): Promise<FieldCipher> {
        return new FormCipher(keys, subject);
      }

      override async opening(subject: string): Promise<FieldCipher | undefined> {
        return subject === "usr_gone" ? undefined : new FormCipher(keys, subject);
      }
    })();
    keys.id = "k1";
    const rows: Row[] = [
      {
        id: "a",
        userId: "raw_live",
        email: await new FormCipher(keys, "usr_live").seal("a@x.io", "crm.profile.email"),
      },
      {
        id: "b",
        userId: "raw_gone",
        email: await new FormCipher(keys, "usr_gone").seal("b@x.io", "crm.profile.email"),
      },
    ];
    keys.id = "k2";
    const customType = { convertToJSValue: (raw: string) => raw.replace("raw_", "usr_") };
    const { em } = managerOf(Profile, rows, { customType });
    const service = new EncryptedFieldsResealService(new FormCipher(keys), keys, resolver);

    expect(await service.reseal(em, Profile)).toEqual({
      scanned: 2,
      resealed: 1,
      skipped: 1,
      cursor: null,
    });
    expect(
      await new FormCipher(keys, "usr_live").open(
        rows[0]?.["email"] as string,
        "crm.profile.email",
      ),
    ).toBe("a@x.io");
    expect(rows[1]?.["email"]).toMatch(/^v1\.k1\./);
  });

  it("refuses a subject-sealed model without a resolver", async () => {
    const keys = new RotatingKeys();
    const rows: Row[] = [
      { id: "a", userId: "usr_a", email: await sealedFor(keys, "k1", "email", "a", "profile") },
    ];
    const { em } = managerOf(Profile, rows);
    await expect(
      new EncryptedFieldsResealService(new FormCipher(keys), keys).reseal(em, Profile),
    ).rejects.toThrow(TypeError);
  });

  it("refuses a model without encrypted fields, a composite key, an unsealed value and a bad limit", async () => {
    const keys = new RotatingKeys();
    const service = new EncryptedFieldsResealService(new FormCipher(keys), keys);
    await expect(service.usage(managerOf(Note, []).em, Note)).rejects.toThrow(TypeError);
    await expect(
      service.usage(managerOf(Contact, [], { primaryKeys: ["id", "version"] }).em, Contact),
    ).rejects.toThrow(TypeError);
    await expect(
      service.reseal(managerOf(Contact, [{ id: "a", email: "plain", phone: null }]).em, Contact),
    ).rejects.toThrow(TypeError);
    await expect(service.reseal(managerOf(Contact, []).em, Contact, { limit: 0 })).rejects.toThrow(
      TypeError,
    );
  });

  it("backfills a missing blind index and rewrites one made under another key", async () => {
    const keys = new RotatingKeys();
    const current = await sealedFor(keys, "k2", "email", "a@x.io", "lead");
    const rows: Row[] = [
      { id: "a", email: current, emailBidx: null },
      {
        id: "b",
        email: await sealedFor(keys, "k2", "email", "b@x.io", "lead"),
        emailBidx: "k1.00",
      },
      { id: "c", email: null, emailBidx: null },
    ];
    const { em } = managerOf(Lead, rows);
    const service = new EncryptedFieldsResealService(new FormCipher(keys), keys);

    expect((await service.usage(em, Lead)).stale).toBe(2);
    expect(await service.reseal(em, Lead)).toEqual({
      scanned: 3,
      resealed: 2,
      skipped: 0,
      cursor: null,
    });
    expect(rows[0]?.["emailBidx"]).toBe(await blindIndexOf(keys, "a@x.io", "crm.lead.email"));
    expect(rows[1]?.["emailBidx"]).toBe(await blindIndexOf(keys, "b@x.io", "crm.lead.email"));
    expect(rows[2]?.["emailBidx"]).toBeNull();
    expect((await service.usage(em, Lead)).stale).toBe(0);
  });

  it("re-seals a scope-bound row in its scope's context and refuses one without a scope id", async () => {
    const keys = new RotatingKeys();
    keys.id = "k1";
    const sealed = await new FormCipher(keys).seal("hello", "crm.message.content@scp_a");
    keys.id = "k2";
    const rows: Row[] = [{ id: "a", scopeId: "scp_a", content: sealed }];
    const { em } = managerOf(Message, rows);
    const cipher = new FormCipher(keys);
    const service = new EncryptedFieldsResealService(cipher, keys);

    expect(await service.reseal(em, Message)).toMatchObject({ resealed: 1, skipped: 0 });
    expect(rows[0]?.["content"]).toMatch(/^v1\.k2\./);
    expect(await cipher.open(rows[0]?.["content"] as string, "crm.message.content@scp_a")).toBe(
      "hello",
    );

    const { em: unscoped } = managerOf(Message, [{ id: "b", scopeId: null, content: sealed }]);
    await expect(service.reseal(unscoped, Message)).rejects.toThrow(/must hold an id/);
  });
});

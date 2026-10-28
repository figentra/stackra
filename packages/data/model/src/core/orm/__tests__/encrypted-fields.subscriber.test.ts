/**
 * Stackra file contract:
 * Purpose: unit tests of `EncryptedFieldsSubscriber`: a create seals every encrypted field under `<model key>.<field>`
 *          and the model gets its plain text back after the write, an update seals only the fields it writes, a null
 *          stays null, a load and an upsert's returned row are opened, the ORM's snapshot is moved to the plain text,
 *          a failed flush is not sealed twice, a model without the trait is left alone, and a non-string value or an
 *          entity without a module schema is refused. A subject-sealed model is sealed and opened with its subject's
 *          cipher, creates no salt for a row of nulls, reseals every field when its subject changes, loads an erased
 *          subject's fields as null, and is refused without a resolver or a subject id. A lookup field gets its blind
 *          index written with each seal and nulled with the field, and is refused without a key provider or without
 *          its declared `<field>Bidx` property. A scope-bound model seals and opens under `<model key>.<field>@<scope id>`,
 *          so a value copied into another scope's row does not open, reseals every field when its scope changes, and
 *          is refused when the row holds no scope id.
 * Boundary: test only; stand-in event arguments shaped like the ORM's, and an in-test `FieldCipher` that is
 *           reversible, not a cipher.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0096 (decision 4); registry gap R-36; ADR 0476.
 */
import type { EventArgs } from "@mikro-orm/core";
import { FieldCipher, KeyProvider } from "@stackra/contracts";
import type { DataKey } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { blindIndexOf } from "#core/functions/blind-index-of.function";
import { EncryptedFieldsSubscriber } from "#core/orm/encrypted-fields.subscriber";
import { SubjectCipherResolver } from "#core/ports/subject-cipher-resolver.port";
import { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";

/** Seals as `sealed(<context>)<plain reversed>`, and opens only in the same context. */
class ReversingCipher extends FieldCipher {
  /** Every context a value was sealed in, in order. */
  readonly contexts: string[] = [];

  /** A tag put before the context, standing in for the key (a subject's id). */
  private readonly tag: string;

  /**
   * @param tag - the key's stand-in; empty for the scope's cipher.
   */
  constructor(tag = "") {
    super();
    this.tag = tag;
  }

  override async seal(plain: string, context: string): Promise<string> {
    this.contexts.push(context);
    return `sealed(${this.tag}${context})${[...plain].reverse().join("")}`;
  }

  override async open(sealed: string, context: string): Promise<string> {
    const prefix = `sealed(${this.tag}${context})`;
    if (!sealed.startsWith(prefix)) throw new Error("Cannot open");
    return [...sealed.substring(prefix.length)].reverse().join("");
  }
}

class CustomerContact extends Model.with(HasEncryptedFields("email", "phone")) {
  email!: string;

  phone: string | null = null;

  name!: string;
}

/** Hands out a cipher per subject that tags its sealed form with the subject; forgets erased subjects. */
class TaggingResolver extends SubjectCipherResolver {
  /** Every subject a sealing cipher was asked for, in order. */
  readonly sealed: string[] = [];

  /** The subjects that were erased. */
  readonly erased = new Set<string>();

  override async sealing(subject: string): Promise<FieldCipher> {
    this.sealed.push(subject);
    return new ReversingCipher(subject);
  }

  override async opening(subject: string): Promise<FieldCipher | undefined> {
    return this.erased.has(subject) ? undefined : new ReversingCipher(subject);
  }
}

class Profile extends Model.with(HasEncryptedFields({ subject: "userId" }, "email", "phone")) {
  userId!: string;

  email: string | null = null;

  phone: string | null = null;
}

class Note extends Model {
  body!: string;
}

/** Stand-in ORM event arguments for `entity` of `type` in `schema`, with an optional update payload and snapshot. */
function argsOf(
  entity: object,
  type: object & { name: string },
  options: { schema?: string; payload?: object; original?: Record<string, unknown> } = {},
): EventArgs<object> {
  if (options.original !== undefined)
    Object.defineProperty(entity, "__helper", {
      value: { __originalEntityData: options.original },
      configurable: true,
    });
  return {
    entity,
    em: {},
    meta: { class: type, className: type.name, schema: options.schema ?? "crm" },
    changeSet: options.payload === undefined ? undefined : { payload: options.payload },
  } as unknown as EventArgs<object>;
}

/** A contact as `em.create` gives it. */
function contactOf(email: string, phone: string | null): CustomerContact {
  return Object.assign(new CustomerContact(), { email, phone, name: "Hala" });
}

describe(EncryptedFieldsSubscriber, () => {
  it("seals a create under the model key and gives the plain text back after the write", async () => {
    const cipher = new ReversingCipher();
    const subscriber = new EncryptedFieldsSubscriber(cipher);
    const contact = contactOf("hala@example.com", "+971500000000");
    const args = argsOf(contact, CustomerContact);

    await subscriber.beforeCreate(args);
    expect(contact.email).toBe("sealed(crm.customer_contact.email)moc.elpmaxe@alah");
    expect(contact.phone).toBe("sealed(crm.customer_contact.phone)000000005179+");
    expect(contact.name).toBe("Hala");

    subscriber.afterCreate(args);
    expect(contact.email).toBe("hala@example.com");
    expect(contact.phone).toBe("+971500000000");
  });

  it("keeps a null as null", async () => {
    const cipher = new ReversingCipher();
    const subscriber = new EncryptedFieldsSubscriber(cipher);
    const contact = contactOf("hala@example.com", null);

    await subscriber.beforeCreate(argsOf(contact, CustomerContact));
    expect(contact.phone).toBeNull();
    expect(cipher.contexts).toEqual(["crm.customer_contact.email"]);
  });

  it("seals only the fields an update writes, and moves the snapshot to the plain text", async () => {
    const cipher = new ReversingCipher();
    const subscriber = new EncryptedFieldsSubscriber(cipher);
    const contact = contactOf("new@example.com", "+971500000000");
    const original: Record<string, unknown> = { email: "sealed-before", phone: "sealed-before" };
    const args = argsOf(contact, CustomerContact, {
      payload: { email: "new@example.com" },
      original,
    });

    await subscriber.beforeUpdate(args);
    expect(contact.email.startsWith("sealed(crm.customer_contact.email)")).toBe(true);
    expect(contact.phone).toBe("+971500000000");

    original["email"] = contact.email;
    subscriber.afterUpdate(args);
    expect(contact.email).toBe("new@example.com");
    expect(original["email"]).toBe("new@example.com");
  });

  it("does not seal twice after a flush that failed", async () => {
    const cipher = new ReversingCipher();
    const subscriber = new EncryptedFieldsSubscriber(cipher);
    const contact = contactOf("hala@example.com", null);
    const args = argsOf(contact, CustomerContact);

    await subscriber.beforeCreate(args);
    const sealed = contact.email;
    await subscriber.beforeCreate(args);
    expect(contact.email).toBe(sealed);
    subscriber.afterCreate(args);
    expect(contact.email).toBe("hala@example.com");
  });

  it("opens a loaded row and moves its snapshot to the plain text", async () => {
    const cipher = new ReversingCipher();
    const subscriber = new EncryptedFieldsSubscriber(cipher);
    const email = await cipher.seal("hala@example.com", "crm.customer_contact.email");
    const contact = contactOf(email, null);
    const original: Record<string, unknown> = { email, phone: null };

    await subscriber.onLoad(argsOf(contact, CustomerContact, { original }));
    expect(contact.email).toBe("hala@example.com");
    expect(contact.phone).toBeNull();
    expect(original).toEqual({ email: "hala@example.com", phone: null });
  });

  it("refuses a value sealed for another column", async () => {
    const cipher = new ReversingCipher();
    const subscriber = new EncryptedFieldsSubscriber(cipher);
    const contact = contactOf(await cipher.seal("x", "crm.customer_contact.phone"), null);

    await expect(subscriber.onLoad(argsOf(contact, CustomerContact))).rejects.toThrow(
      "Cannot open",
    );
  });

  it("seals an upsert's data and opens the row it returns", async () => {
    const cipher = new ReversingCipher();
    const subscriber = new EncryptedFieldsSubscriber(cipher);
    const data: Record<string, unknown> = { email: "hala@example.com", phone: null };

    await subscriber.beforeUpsert(argsOf(data, CustomerContact));
    expect(data["email"]).toBe("sealed(crm.customer_contact.email)moc.elpmaxe@alah");

    const returned = contactOf(String(data["email"]), null);
    await subscriber.afterUpsert(argsOf(returned, CustomerContact));
    expect(returned.email).toBe("hala@example.com");
  });

  it("gives an upserted entity its plain text back without opening it", async () => {
    const cipher = new ReversingCipher();
    const subscriber = new EncryptedFieldsSubscriber(cipher);
    const contact = contactOf("hala@example.com", null);
    const args = argsOf(contact, CustomerContact);

    await subscriber.beforeUpsert(args);
    await subscriber.afterUpsert(args);
    expect(contact.email).toBe("hala@example.com");
  });

  it("leaves a model without the trait alone", async () => {
    const cipher = new ReversingCipher();
    const subscriber = new EncryptedFieldsSubscriber(cipher);
    const note = Object.assign(new Note(), { body: "plain" });

    await subscriber.beforeCreate(argsOf(note, Note));
    await subscriber.onLoad(argsOf(note, Note));
    expect(note.body).toBe("plain");
    expect(cipher.contexts).toEqual([]);
  });

  it("refuses a value that is not a string, and an entity without a module schema", async () => {
    const subscriber = new EncryptedFieldsSubscriber(new ReversingCipher());
    const wrong = Object.assign(contactOf("hala@example.com", null), { phone: 971 });

    await expect(subscriber.beforeCreate(argsOf(wrong, CustomerContact))).rejects.toThrow(
      TypeError,
    );
    await expect(
      subscriber.beforeCreate(argsOf(contactOf("a@b.c", null), CustomerContact, { schema: "" })),
    ).rejects.toThrow(TypeError);
  });

  it("seals a subject-sealed row with its subject's cipher and opens it with the same", async () => {
    const resolver = new TaggingResolver();
    const subscriber = new EncryptedFieldsSubscriber(new ReversingCipher(), resolver);
    const profile = Object.assign(new Profile(), { userId: "usr_1", email: "hala@example.com" });
    const args = argsOf(profile, Profile);

    await subscriber.beforeCreate(args);
    expect(profile.email).toBe("sealed(usr_1crm.profile.email)moc.elpmaxe@alah");
    expect(profile.phone).toBeNull();
    expect(resolver.sealed).toEqual(["usr_1"]);
    subscriber.afterCreate(args);

    const loaded = Object.assign(new Profile(), {
      userId: "usr_1",
      email: "sealed(usr_1crm.profile.email)moc.elpmaxe@alah",
    });
    await subscriber.onLoad(argsOf(loaded, Profile));
    expect(loaded.email).toBe("hala@example.com");
  });

  it("asks for no subject cipher when a row holds only nulls", async () => {
    const resolver = new TaggingResolver();
    const subscriber = new EncryptedFieldsSubscriber(new ReversingCipher(), resolver);

    await subscriber.beforeCreate(
      argsOf(Object.assign(new Profile(), { userId: "usr_1" }), Profile),
    );
    expect(resolver.sealed).toEqual([]);
  });

  it("reseals every field when an update changes the subject", async () => {
    const resolver = new TaggingResolver();
    const subscriber = new EncryptedFieldsSubscriber(new ReversingCipher(), resolver);
    const profile = Object.assign(new Profile(), {
      userId: "usr_2",
      email: "hala@example.com",
      phone: "+971500000000",
    });

    await subscriber.beforeUpdate(argsOf(profile, Profile, { payload: { userId: "usr_2" } }));
    expect(profile.email).toBe("sealed(usr_2crm.profile.email)moc.elpmaxe@alah");
    expect(profile.phone).toBe("sealed(usr_2crm.profile.phone)000000005179+");
  });

  it("loads an erased subject's fields as null", async () => {
    const resolver = new TaggingResolver();
    resolver.erased.add("usr_1");
    const subscriber = new EncryptedFieldsSubscriber(new ReversingCipher(), resolver);
    const original: Record<string, unknown> = { email: "sealed(usr_1crm.profile.email)x" };
    const profile = Object.assign(new Profile(), {
      userId: "usr_1",
      email: "sealed(usr_1crm.profile.email)x",
    });

    await subscriber.onLoad(argsOf(profile, Profile, { original }));
    expect(profile.email).toBeNull();
    expect(original["email"]).toBeNull();
  });

  it("refuses a subject-sealed row without a resolver or without a subject id", async () => {
    const withoutResolver = new EncryptedFieldsSubscriber(new ReversingCipher());
    const profile = Object.assign(new Profile(), { userId: "usr_1", email: "a@b.c" });
    await expect(withoutResolver.beforeCreate(argsOf(profile, Profile))).rejects.toThrow(
      /needs a SubjectCipherResolver/,
    );

    const subscriber = new EncryptedFieldsSubscriber(new ReversingCipher(), new TaggingResolver());
    const orphan = Object.assign(new Profile(), { email: "a@b.c" });
    await expect(subscriber.beforeCreate(argsOf(orphan, Profile))).rejects.toThrow(
      /must hold an id/,
    );
  });
});

class OneKey extends KeyProvider {
  override async current(): Promise<DataKey> {
    return { id: "k1", key: new Uint8Array(32).fill(3) };
  }

  override async byId(id: string): Promise<DataKey> {
    return { id, key: new Uint8Array(32).fill(3) };
  }
}

class Lead extends Model.with(HasEncryptedFields({ lookup: ["email"] }, "email", "phone")) {
  email: string | null = null;

  emailBidx: string | null = null;

  phone: string | null = null;
}

/** Stand-in ORM event arguments for a lead, its metadata declaring `properties`. */
function leadArgs(lead: Lead, properties: readonly string[], payload?: object): EventArgs<object> {
  return {
    entity: lead,
    em: {},
    meta: {
      class: Lead,
      className: "Lead",
      schema: "crm",
      properties: Object.fromEntries(properties.map((name) => [name, {}])),
    },
    changeSet: payload === undefined ? undefined : { payload },
  } as unknown as EventArgs<object>;
}

/** A new lead with an email. */
function newLead(): Lead {
  return Object.assign(new Lead(), { email: "hala@example.com" });
}

describe("EncryptedFieldsSubscriber with lookup fields", () => {
  const declared = ["email", "emailBidx", "phone"];

  it("writes the blind index of a lookup field when it seals it, and none for other fields", async () => {
    const keys = new OneKey();
    const subscriber = new EncryptedFieldsSubscriber(new ReversingCipher(), undefined, keys);
    const lead = Object.assign(new Lead(), { email: "hala@example.com", phone: "1" });

    await subscriber.beforeCreate(leadArgs(lead, declared));
    expect(lead.emailBidx).toBe(await blindIndexOf(keys, "hala@example.com", "crm.lead.email"));
    expect(lead.email).toBe("sealed(crm.lead.email)moc.elpmaxe@alah");
  });

  it("nulls the index when the field is written null", async () => {
    const subscriber = new EncryptedFieldsSubscriber(
      new ReversingCipher(),
      undefined,
      new OneKey(),
    );
    const lead = Object.assign(new Lead(), { email: null, emailBidx: "k1.old" });

    await subscriber.beforeUpdate(leadArgs(lead, declared, { email: null }));
    expect(lead.emailBidx).toBeNull();
  });

  it("refuses a lookup field without a key provider or without its declared index property", async () => {
    await expect(
      new EncryptedFieldsSubscriber(new ReversingCipher()).beforeCreate(
        leadArgs(newLead(), declared),
      ),
    ).rejects.toThrow(/needs a KeyProvider/);
    await expect(
      new EncryptedFieldsSubscriber(new ReversingCipher(), undefined, new OneKey()).beforeCreate(
        leadArgs(newLead(), ["email", "phone"]),
      ),
    ).rejects.toThrow(/declares emailBidx/);
  });
});

class ScopedMessage extends Model.with(
  HasEncryptedFields({ scope: "scopeId" }, "content", "title"),
) {
  scopeId!: string;

  content!: string;

  title: string | null = null;
}

/** A message of `scopeId` as `em.create` gives it. */
function messageOf(scopeId: string, content: string): ScopedMessage {
  return Object.assign(new ScopedMessage(), { scopeId, content, title: null });
}

describe("EncryptedFieldsSubscriber with a scope binding", () => {
  it("binds each value to the row's scope and opens it only in that scope's row", async () => {
    const subscriber = new EncryptedFieldsSubscriber(new ReversingCipher());
    const message = messageOf("scp_a", "hello");

    await subscriber.beforeCreate(argsOf(message, ScopedMessage, { schema: "ai" }));
    expect(message.content).toBe("sealed(ai.scoped_message.content@scp_a)olleh");
    const sealed = message.content;

    const own = Object.assign(new ScopedMessage(), { scopeId: "scp_a", content: sealed });
    await subscriber.onLoad(argsOf(own, ScopedMessage, { schema: "ai" }));
    expect(own.content).toBe("hello");

    const copied = Object.assign(new ScopedMessage(), { scopeId: "scp_b", content: sealed });
    await expect(
      subscriber.onLoad(argsOf(copied, ScopedMessage, { schema: "ai" })),
    ).rejects.toThrow("Cannot open");
  });

  it("reseals every field when an update changes the scope", async () => {
    const subscriber = new EncryptedFieldsSubscriber(new ReversingCipher());
    const message = Object.assign(messageOf("scp_b", "hello"), { title: "hi" });

    await subscriber.beforeUpdate(
      argsOf(message, ScopedMessage, { schema: "ai", payload: { scopeId: "scp_b" } }),
    );
    expect(message.content).toBe("sealed(ai.scoped_message.content@scp_b)olleh");
    expect(message.title).toBe("sealed(ai.scoped_message.title@scp_b)ih");
  });

  it.each([undefined, ""])("refuses a row whose scope id is %j", async (scopeId) => {
    const subscriber = new EncryptedFieldsSubscriber(new ReversingCipher());
    const message = Object.assign(new ScopedMessage(), { scopeId, content: "hello" });

    await expect(
      subscriber.beforeCreate(argsOf(message, ScopedMessage, { schema: "ai" })),
    ).rejects.toThrow(/must hold an id/);
  });
});

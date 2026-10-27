/**
 * Stackra file contract:
 * Purpose: unit tests of `createSourceReader`'s refusals on a fixture of banned forms: `shape_number_kind`,
 *          `shape_unknown_type` (a literal union, an interface, an inferred enum literal with the annotation fix),
 *          `shape_default_not_constant`, `shape_rule_not_constant`, `shape_hatch_reason_missing`,
 *          `shape_decorator_type_mismatch`, `action_handle_signature`, `two_declarations_in_file`,
 *          `partner_mismatch`, `event_base_abstract` and `token_not_a_class` (never for a `#stackra/clients/*`
 *          client, which is a class token before its file exists), each with a position and a fix; a
 *          derived shape (`PickType`) and a discriminated union read correctly; and each model's entity facts
 *          (`[OptionalProps]` keys, a one-to-many with its inverse, a `Ref` many-to-one, a `Link` across models,
 *          getters) with `relation_decorator_missing` for a relation gen cannot read; `Translated`,
 *          `TranslatedStrings` and `Upload<Bucket>` fields read as the `translated` and `upload` kinds (STA-1218);
 *          a replica query's `Promise<ReplicaPage>` or `Promise<ReplicaPage<T>>` reads as `replica` (ADR 0338); a
 *          listener's `handle` parameter reads as its event class (its own, or a `#stackra/clients/*` one by its import),
 *          `EventEnvelope` as a relay, and anything else as `listener_handle_signature` (ADR 0260 decision 4); a
 *          trailing `tool: false, // reason:` comment; and the OS gen pass forms (STA-1283): a bare or prefix-union
 *          `PublicId`, `Readonly<Record>`, an imported regular expression constant and `this.<field>` spreads; and a
 *          field typed with another package's interface, alias or union that ships `X$` read as `shipped` (STA-1290).
 *          A `@Field(zod)` hatch carries the named imports its source uses, and `clientImports` lists the services any own
 *          file (tests included) imports a client from (STA-1293). A package config override takes its fields from the base's
 *          `Config({ schema })` options class, reading `this.<field>` spreads, `Object.freeze` constants and `I18n` keys
 *          as constants, and a shipped `X$` of a declared package the program never loaded is still found (STA-1296).
 *          `kind_base_name_reserved`, `partner_mismatch` for a same-stem kind (a Resource), `secret_name_missing` and
 *          each file's exported class names (STA-1306). A `@Classify(Class)` facet carries its data class's constant
 *          effects as `options.dataClass` (STA-1251). Each exported `defineSlot<P>` and `fillSlot` of `@stackra/panel`
 *          reads with its options, import and props record, and a non-constant fill is `slot_options_not_constant`
 *          (ADR 0438). A `PickType` of, or a form extending, a `remoteShape` of `#stackra/clients/<service>` reads as a
 *          `remote` base; `Settings.pick` of `#stackra/settings` is a schema kind; a renamed enum case in a default is
 *          `shape_default_member_unresolved` (STA-1363). A `Settings.pick([...])` class compiles over the picked keys of
 *          the member's own settings classes, a section's key included, and an unknown key is `settings_key_unresolved`
 *          (stackra-209).
 * Boundary: test only; writes the fixture under `.cache/` and opens TypeScript on it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26, 2026-10-23 item 13, decision 28); ADR 0305
 *                     (rules 6, 13 and 19); ADR 0097 (decision 3); ADR 0162 (decision 2); ADR 0222 (decision 2);
 *                     ADR 0260 (decision 4).
 */
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { createSourceReader } from "#node/functions/create-source-reader.function";
import { openHost } from "#node/functions/open-host.function";
import { readMemberFacts } from "#node/functions/read-member-facts.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

/** The banned and edge forms, one per file. */
const SOURCES: Readonly<Record<string, string>> = {
  "src/core/schemas/banned.schema.ts": [
    'import { Field, Int, Str, Schema } from "@stackra/validation";',
    'import { OrderStatus } from "#contracts/enums/order-status.enum";',
    "",
    "interface Loose { a: string }",
    // A const with a constant initializer is a constant (gen AGENTS.md), so the rule reads one computed at run time.
    'const LIMIT: number = Number("5");',
    "",
    "export class Banned extends Schema {",
    "  count!: number;",
    '  mode!: "a" | "b";',
    "  loose!: Loose;",
    "  status = OrderStatus.Paid;",
    "  createdAt: Date = new Date();",
    "  @Int({ max: LIMIT })",
    "  capped!: number;",
    "  @Field(OrderStatus)",
    "  hatched!: string;",
    "  @Str({ max: 3 })",
    "  misplaced!: boolean;",
    "}",
    "",
  ].join("\n"),
  "src/contracts/enums/order-status.enum.ts": [
    'import { Enum } from "@stackra/contracts";',
    'export const OrderStatus = Enum.of({ Pending: "pending", Paid: "paid" });',
    "export type OrderStatus = Enum.Value<typeof OrderStatus>;",
    "",
  ].join("\n"),
  "src/core/schemas/two.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    "export class One extends Schema {}",
    "export class Two extends Schema {}",
    "",
  ].join("\n"),
  "src/node/actions/untyped.action.ts": [
    'import { Action } from "@stackra/actions";',
    'export class UntypedAction extends Action({ key: "order.untyped" }) {',
    "  async handle(input: string): Promise<number> {",
    "    return input.length;",
    "  }",
    "}",
    "",
  ].join("\n"),
  "src/node/queries/replica.query.ts": [
    'import { Query, type ReplicaPage } from "@stackra/actions";',
    'export class ReplicaQuery extends Query({ key: "order.replica" }) {',
    "  async handle(): Promise<ReplicaPage> {",
    '    return { rows: [], removed: [], cursor: "0", asOf: new Date(), full: true };',
    "  }",
    "}",
    "",
  ].join("\n"),
  "src/node/queries/typed-replica.query.ts": [
    'import { Query, type ReplicaPage } from "@stackra/actions";',
    'export class TypedReplicaQuery extends Query({ key: "order.typed_replica" }) {',
    "  async handle(): Promise<ReplicaPage<string>> {",
    '    return { rows: [], removed: [], cursor: "0", asOf: new Date(), full: true };',
    "  }",
    "}",
    "",
  ].join("\n"),
  "src/node/events/raw.event.ts": [
    'import { Event } from "@stackra/events";',
    "export class RawEvent extends Event {}",
    "",
  ].join("\n"),
  "src/core/services/bad-token.service.ts": [
    'import { Service } from "@stackra/container";',
    "export class BadTokenService extends Service {",
    "  constructor(private readonly name: string) {",
    "    super();",
    "  }",
    "}",
    "",
  ].join("\n"),
  "src/core/services/catalogue-reader.service.ts": [
    'import { Service } from "@stackra/container";',
    'import type { CatalogueClient } from "#stackra/clients/catalogue";',
    "export class CatalogueReaderService extends Service {",
    "  constructor(private readonly catalogue: CatalogueClient) {",
    "    super();",
    "  }",
    "}",
    "",
  ].join("\n"),
  "src/core/events/order-placed.event.ts": [
    'import { IntegrationEvent } from "@stackra/events";',
    'export class OrderPlaced extends IntegrationEvent({ name: "order.placed" }) {}',
    "",
  ].join("\n"),
  "src/core/listeners/ship-on-order-placed.listener.ts": [
    'import { Listener } from "@stackra/events";',
    'import { OrderPlaced } from "#core/events/order-placed.event";',
    "export class ShipOnOrderPlacedListener extends Listener {",
    "  async handle(event: OrderPlaced): Promise<void> {}",
    "}",
    "",
  ].join("\n"),
  "src/core/listeners/list-on-app-approved.listener.ts": [
    'import { Listener } from "@stackra/events";',
    'import type { AppApproved } from "#stackra/clients/developer";',
    "export class ListOnAppApprovedListener extends Listener {",
    "  async handle(event: AppApproved): Promise<void> {}",
    "}",
    "",
  ].join("\n"),
  "src/core/listeners/webhooks-relay.listener.ts": [
    'import { Listener } from "@stackra/events";',
    'import type { EventEnvelope } from "@stackra/outbox/contracts";',
    "export class WebhooksRelayListener extends Listener {",
    "  async handle(envelope: EventEnvelope): Promise<void> {}",
    "}",
    "",
  ].join("\n"),
  "src/core/listeners/by-name.listener.ts": [
    'import { Listener } from "@stackra/events";',
    "export class ByNameListener extends Listener {",
    "  async handle(event: string): Promise<void> {}",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/order-view.schema.ts": [
    'import type { PublicId } from "@stackra/contracts";',
    'import { Schema } from "@stackra/validation";',
    "export class OrderView extends Schema {",
    '  id!: PublicId<"ord">;',
    "  note?: string;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/order-ref.schema.ts": [
    'import { PickType } from "@stackra/validation";',
    'import { OrderView } from "#core/schemas/order-view.schema";',
    'export class OrderRef extends PickType(OrderView, ["id"]) {}',
    "",
  ].join("\n"),
  "src/core/schemas/link-cta.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    'import { OrderStatus } from "#contracts/enums/order-status.enum";',
    "export class LinkCta extends Schema {",
    "  kind!: typeof OrderStatus.Pending;",
    "  href!: string;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/paid-cta.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    'import { OrderStatus } from "#contracts/enums/order-status.enum";',
    "export class PaidCta extends Schema {",
    "  kind!: typeof OrderStatus.Paid;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/banner.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    'import { LinkCta } from "#core/schemas/link-cta.schema";',
    'import { PaidCta } from "#core/schemas/paid-cta.schema";',
    "export class Banner extends Schema {",
    "  cta!: LinkCta | PaidCta;",
    "}",
    "",
  ].join("\n"),
};

describe("createSourceReader", async () => {
  const root = writeFixtureMember("banned", SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const shapes = reader.sources.flatMap((file) => reader.shapes(file));
  const declared: ReturnType<typeof reader.classes>[number][] = [];
  for (const file of reader.sources) {
    declared.push(...reader.classes(file));
    reader.exports(file);
  }
  host.close();
  const codes = reader.errors.map((error) => `${error.code} ${error.subject}`);

  it("refuses the banned shape forms with a fix", () => {
    expect(codes).toContain("shape_number_kind Banned.count");
    expect(codes).toContain("shape_unknown_type Banned.mode");
    expect(codes).toContain("shape_unknown_type Banned.loose");
    expect(codes).toContain("shape_unknown_type Banned.status");
    expect(codes).toContain("shape_default_not_constant Banned.createdAt");
    expect(codes).toContain("shape_rule_not_constant Banned.capped");
    expect(codes).toContain("shape_hatch_reason_missing Banned.hatched");
    expect(codes).toContain("shape_decorator_type_mismatch Banned.misplaced");
    const status = reader.errors.find((error) => error.subject === "Banned.status");
    expect(status?.fix).toBe("annotate the field: `status: OrderStatus = OrderStatus.Paid`");
    expect(status?.file).toBe("src/core/schemas/banned.schema.ts");
    expect(status?.line).toBeGreaterThan(0);
  });

  it("refuses the banned class and file forms", () => {
    expect(codes).toContain("two_declarations_in_file src/core/schemas/two.schema.ts");
    expect(codes).toContain("action_handle_signature UntypedAction");
    expect(codes).toContain("event_base_abstract RawEvent");
    expect(codes).toContain("token_not_a_class BadTokenService.constructor");
  });

  it("accepts ReplicaPage and ReplicaPage<T> as a replica query's output (ADR 0338)", () => {
    expect(codes).not.toContain("action_handle_signature ReplicaQuery");
    expect(codes).not.toContain("action_handle_signature TypedReplicaQuery");
    expect(declared.find((item) => item.name === "ReplicaQuery")?.handle).toEqual({
      replica: true,
    });
    expect(declared.find((item) => item.name === "TypedReplicaQuery")?.handle).toEqual({
      replica: true,
    });
  });

  it("takes a generated client as its class token before its file exists", () => {
    expect(codes).not.toContain("token_not_a_class CatalogueReaderService.constructor");
    expect(declared.find((item) => item.name === "CatalogueReaderService")?.deps).toEqual([
      { class: { name: "CatalogueClient", from: "#stackra/clients/catalogue" } },
    ]);
  });

  it("reads a listener's event class: its own, or a generated client's by its import", () => {
    const own = declared.find((item) => item.name === "ShipOnOrderPlacedListener")?.handle;
    expect(own?.event?.name).toBe("OrderPlaced");
    expect(own?.event?.from).toContain("order-placed.event");
    expect(declared.find((item) => item.name === "ListOnAppApprovedListener")?.handle).toEqual({
      event: { name: "AppApproved", from: "#stackra/clients/developer" },
    });
    expect(codes).not.toContain("listener_handle_signature ListOnAppApprovedListener");
  });

  it("reads an EventEnvelope parameter as a relay and refuses a parameter that is no event class", () => {
    expect(declared.find((item) => item.name === "WebhooksRelayListener")?.handle).toEqual({
      relay: true,
    });
    expect(codes).toContain("listener_handle_signature ByNameListener");
    expect(codes).not.toContain("listener_handle_signature WebhooksRelayListener");
  });

  it("reads a derived shape and a discriminated union", () => {
    expect(
      shapes.find((shape) => shape.name === "OrderRef")?.fields.map((field) => field.name),
    ).toEqual(["id"]);
    expect(shapes.find((shape) => shape.name === "Banner")?.fields[0]?.type).toEqual({
      kind: "union",
      discriminator: "kind",
      members: [
        { name: "LinkCta", module: "banned" },
        { name: "PaidCta", module: "banned" },
      ],
    });
    expect(shapes.find((shape) => shape.name === "PaidCta")?.fields[0]?.type).toEqual({
      kind: "enum",
      name: "OrderStatus.Paid",
      values: ["paid"],
    });
  });
});

/** A stand-in `@stackra/model`: the kind base, two traits, the relation types and decorators. */
const MODEL_STAND_IN: Readonly<Record<string, string>> = {
  "node_modules/@stackra/model/package.json": JSON.stringify({
    name: "@stackra/model",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/model/index.d.ts": [
    'export declare abstract class ModelBase { protected readonly "~kind": "model"; }',
    'export interface Trait<F extends object> { readonly "~fields"?: F; }',
    "type Fields<T extends readonly unknown[]> = T extends readonly [infer Head, ...infer Rest]",
    "  ? (Head extends Trait<infer F> ? F : unknown) & Fields<Rest>",
    "  : unknown;",
    "export declare const Model: {",
    "  with<T extends readonly Trait<object>[]>(...traits: T): abstract new () => ModelBase & Fields<T>;",
    "};",
    "export declare function HasPublicId<P extends string>(prefix: P): Trait<{ id: string }>;",
    "export declare const Timestamps: Trait<{ createdAt: Date; updatedAt: Date }>;",
    'export declare class Collection<T extends object> { constructor(owner: object); readonly "~items"?: T; }',
    'export type Ref<T extends object> = T & { readonly "~ref": true };',
    'export type Link<T extends object> = { readonly "~link"?: T; readonly id: string };',
    "type ModelClass<M> = abstract new (...args: never[]) => M;",
    "export declare function ManyToOne<M extends object>(target: () => ModelClass<M>, options?: { readonly onDelete?: string }): (target: object, key: string) => void;",
    "export declare function OneToMany<M extends object>(target: () => ModelClass<M>, inverse: (item: M) => unknown, options?: { readonly orphanRemoval?: boolean }): (target: object, key: string) => void;",
    "",
  ].join("\n"),
};

/** Three models: a one-to-many with its inverse, a link, a getter and a relation with no decorator. */
const MODEL_SOURCES: Readonly<Record<string, string>> = {
  ...MODEL_STAND_IN,
  "src/node/models/order.model.ts": [
    'import { Collection, HasPublicId, Model, OneToMany, Timestamps } from "@stackra/model";',
    'import { OrderLine } from "#node/models/order-line.model";',
    "",
    'export class Order extends Model.with(HasPublicId("ord"), Timestamps) {',
    '  status: string = "pending";',
    "",
    "  @OneToMany(() => OrderLine, (line) => line.order, { orphanRemoval: true })",
    "  lines = new Collection<OrderLine>(this);",
    "",
    "  get isOpen(): boolean {",
    '    return this.status === "pending";',
    "  }",
    "}",
    "",
  ].join("\n"),
  "src/node/models/order-line.model.ts": [
    'import { HasPublicId, ManyToOne, Model } from "@stackra/model";',
    'import type { Link, Ref } from "@stackra/model";',
    'import { Customer } from "#node/models/customer.model";',
    'import { Order } from "#node/models/order.model";',
    "",
    'export class OrderLine extends Model.with(HasPublicId("oln")) {',
    '  @ManyToOne(() => Order, { onDelete: "cascade" })',
    "  order!: Ref<Order>;",
    "",
    "  note!: string | null;",
    "",
    "  customer!: Link<Customer> | null;",
    "",
    "  bad!: Ref<Order>;",
    "}",
    "",
  ].join("\n"),
  "src/node/models/customer.model.ts": [
    'import { HasPublicId, Model } from "@stackra/model";',
    "",
    'export class Customer extends Model.with(HasPublicId("cus")) {}',
    "",
  ].join("\n"),
};

describe("createSourceReader on models", async () => {
  const root = writeFixtureMember("models", MODEL_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const shapes = reader.sources.flatMap((file) => reader.shapes(file));
  host.close();
  const entity = (name: string) => shapes.find((shape) => shape.name === name)?.entity;

  it("reads the keys a create may leave out and the getters", () => {
    expect(entity("Order")?.optional).toEqual(["createdAt", "id", "lines", "status", "updatedAt"]);
    expect(entity("Order")?.computed).toEqual(["isOpen"]);
    expect(entity("OrderLine")?.optional).toEqual(["id"]);
    expect(entity("Customer")).toEqual({ optional: ["id"], relations: [], computed: [] });
  });

  it("reads a one-to-many with its inverse and options", () => {
    expect(entity("Order")?.relations).toEqual([
      {
        name: "lines",
        kind: "1:m",
        target: { name: "OrderLine", from: "#node/models/order-line.model" },
        targetModule: "models",
        nullable: false,
        ref: false,
        inverse: "order",
        options: { orphanRemoval: true },
      },
    ]);
  });

  it("reads a Ref many-to-one and a nullable Link, and refuses a relation it cannot read", () => {
    expect(entity("OrderLine")?.relations).toEqual([
      {
        name: "order",
        kind: "m:1",
        target: { name: "Order", from: "#node/models/order.model" },
        targetModule: "models",
        nullable: false,
        ref: true,
        options: { onDelete: "cascade" },
      },
      {
        name: "customer",
        kind: "link",
        target: { name: "Customer", from: "#node/models/customer.model" },
        targetModule: "models",
        nullable: true,
        ref: false,
        options: {},
      },
    ]);
    expect(reader.errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "relation_decorator_missing OrderLine.bad",
    ]);
  });
});

/** An action whose `tool: false` carries its reason, and one without. */
const TOOL_SOURCES: Readonly<Record<string, string>> = {
  "src/node/actions/open-drawer.action.ts": [
    'import { Action } from "@stackra/actions";',
    'import { ActorKind } from "@stackra/contracts";',
    "",
    "export class OpenDrawerAction extends Action({",
    '  key: "drawer.open",',
    "  actors: [ActorKind.User],",
    "  // reason: opens a physical cash drawer at the till",
    "  tool: false,",
    "}) {",
    "  async handle(): Promise<void> {}",
    "}",
    "",
  ].join("\n"),
  "src/node/actions/close-drawer.action.ts": [
    'import { Action } from "@stackra/actions";',
    'import { ActorKind } from "@stackra/contracts";',
    "",
    "export class CloseDrawerAction extends Action({",
    '  key: "drawer.close",',
    "  actors: [ActorKind.User],",
    "  tool: false,",
    "}) {",
    "  async handle(): Promise<void> {}",
    "}",
    "",
  ].join("\n"),
  "src/node/actions/hand-over.action.ts": [
    'import { Action } from "@stackra/actions";',
    'import { ActorKind } from "@stackra/contracts";',
    "",
    "export class HandOverAction extends Action({",
    '  key: "drawer.hand_over",',
    "  tool: false, // reason: hands the till to a person",
    "  actors: [ActorKind.User],",
    "}) {",
    "  async handle(): Promise<void> {}",
    "}",
    "",
  ].join("\n"),
};

describe("createSourceReader on tool reasons", async () => {
  const root = writeFixtureMember("tools", TOOL_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const classes = reader.sources.flatMap((file) => reader.classes(file));
  host.close();
  const options = (name: string) => classes.find((declared) => declared.name === name)?.options;

  it("reads the `// reason:` line above `tool: false` as `toolReason`", () => {
    expect(options("OpenDrawerAction")).toMatchObject({
      tool: false,
      toolReason: "opens a physical cash drawer at the till",
    });
  });

  it("reads a trailing `// reason:` comment on the `tool: false` line too", () => {
    expect(options("HandOverAction")).toMatchObject({
      tool: false,
      toolReason: "hands the till to a person",
    });
  });

  it("leaves `toolReason` out when no reason is written", () => {
    expect(options("CloseDrawerAction")?.["toolReason"]).toBeUndefined();
  });
});

/** Per-locale and upload fields (STA-1218), with stand-ins for `@stackra/model` and `@stackra/media`. */
const VOCABULARY_SOURCES: Readonly<Record<string, string>> = {
  "node_modules/@stackra/model/package.json": JSON.stringify({
    name: "@stackra/model",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/model/index.d.ts": [
    "export declare class Translated {",
    "  private constructor();",
    "  readonly values: Readonly<Record<string, string>>;",
    "}",
    "",
  ].join("\n"),
  "node_modules/@stackra/media/package.json": JSON.stringify({
    name: "@stackra/media",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/media/index.d.ts": [
    'export declare abstract class BucketBase { protected readonly "~kind": "bucket"; }',
    "export declare function Bucket(options: Readonly<Record<string, unknown>>): abstract new () => BucketBase;",
    'export type Upload<B extends BucketBase = BucketBase> = { readonly id: string; readonly "~bucket"?: B };',
    "",
  ].join("\n"),
  "src/core/buckets/photos.bucket.ts": [
    'import { Bucket } from "@stackra/media";',
    "export class PhotosBucket extends Bucket({}) {}",
    "",
  ].join("\n"),
  "src/core/schemas/listing.schema.ts": [
    'import type { Upload } from "@stackra/media";',
    'import type { Translated } from "@stackra/model";',
    'import { Schema, Str, type TranslatedStrings } from "@stackra/validation";',
    'import type { PhotosBucket } from "#core/buckets/photos.bucket";',
    "",
    "class NotABucket {}",
    "",
    "export class Listing extends Schema {",
    "  @Str({ max: 200 })",
    "  title!: Translated;",
    "  description!: Translated | null;",
    "  label!: TranslatedStrings;",
    "  photo!: Upload<PhotosBucket>;",
    "  anything!: Upload;",
    "  wrong!: Upload<NotABucket>;",
    "}",
    "",
  ].join("\n"),
};

describe("createSourceReader on translated and upload fields", async () => {
  const root = writeFixtureMember("vocabulary", VOCABULARY_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const shapes = reader.sources.flatMap((file) => reader.shapes(file));
  for (const file of reader.sources) reader.classes(file);
  host.close();
  const listing = shapes.find((shape) => shape.name === "Listing");
  const field = (name: string) => listing?.fields.find((candidate) => candidate.name === name);

  it("reads Translated and TranslatedStrings as the translated kind, @Str included", () => {
    expect(field("title")).toMatchObject({
      type: { kind: "translated", form: "value" },
      nullable: false,
      rules: [{ name: "Str", options: { max: 200 } }],
    });
    expect(field("description")).toMatchObject({
      type: { kind: "translated", form: "value" },
      nullable: true,
    });
    expect(field("label")?.type).toEqual({ kind: "translated", form: "strings" });
  });

  it("reads Upload<Bucket> as the upload kind with its bucket", () => {
    expect(field("photo")?.type).toEqual({ kind: "upload", bucket: "PhotosBucket" });
    expect(field("anything")?.type).toEqual({ kind: "upload" });
  });

  it("refuses an Upload whose argument is not a Bucket class, and nothing else", () => {
    const subjects = reader.errors
      .filter((error) => error.code === "shape_unknown_type")
      .map((error) => error.subject);
    expect(subjects).toEqual(["Listing.wrong"]);
    expect(reader.errors.some((error) => error.code === "shape_decorator_type_mismatch")).toBe(
      false,
    );
  });
});

/** The forms the OS gen pass of 2026-10-26 refused that gen now reads (STA-1283). */
const GEN_PASS_SOURCES: Readonly<Record<string, string>> = {
  "src/core/constants/meter-code.constant.ts": "export const METER_CODE = /^[a-z_]+$/;\n",
  "src/core/schemas/grant.schema.ts": [
    'import type { PublicId } from "@stackra/contracts";',
    'import { Schema, Str } from "@stackra/validation";',
    'import { METER_CODE } from "#core/constants/meter-code.constant";',
    "",
    "export class Grant extends Schema {",
    "  principalId!: PublicId;",
    '  listId!: PublicId<"crl" | "prl">;',
    "  @Str({ max: 40 })",
    "  subjectId!: PublicId;",
    "  labels!: Readonly<Record<string, string>>;",
    "  @Str({ pattern: METER_CODE })",
    "  meter!: string;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/base-limits.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    "",
    "export class BaseLimits extends Schema {",
    '  levels: string[] = ["tenant"];',
    "  errors: Record<string, boolean> = { enabled: false };",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/limits.schema.ts": [
    'import { BaseLimits } from "#core/schemas/base-limits.schema";',
    "",
    "export class Limits extends BaseLimits {",
    '  override levels = [...this.levels, "location"];',
    "  override errors = { ...this.errors, sampled: true };",
    "}",
    "",
  ].join("\n"),
};

describe("createSourceReader on the OS gen pass forms", async () => {
  const root = writeFixtureMember("gen-pass", GEN_PASS_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const shapes = reader.sources.flatMap((file) => reader.shapes(file));
  for (const file of reader.sources) reader.classes(file);
  host.close();
  const field = (shape: string, name: string) =>
    shapes
      .find((candidate) => candidate.name === shape)
      ?.fields.find((candidate) => candidate.name === name);

  it("reads a bare PublicId as any prefix and a prefix union as its prefixes", () => {
    expect(field("Grant", "principalId")?.type).toEqual({ kind: "public_id", prefix: "" });
    expect(field("Grant", "listId")?.type).toEqual({
      kind: "public_id",
      prefix: "",
      prefixes: ["crl", "prl"],
    });
    expect(reader.errors.some((error) => error.code === "shape_unknown_type")).toBe(false);
  });

  it("reads a decorated bare PublicId the same way, refusing only the decorator", () => {
    expect(field("Grant", "subjectId")?.type).toEqual({ kind: "public_id", prefix: "" });
    const mismatch = reader.errors.find((error) => error.subject === "Grant.subjectId");
    expect(mismatch?.code).toBe("shape_decorator_type_mismatch");
    expect(mismatch?.message).toContain("public_id");
  });

  it("unwraps Readonly<Record> and takes an imported regular expression as a constant", () => {
    expect(field("Grant", "labels")?.type).toEqual({ kind: "record", value: { kind: "string" } });
    expect(field("Grant", "meter")?.rules).toEqual([
      { name: "Str", options: { pattern: { $regex: "^[a-z_]+$", flags: "" } } },
    ]);
    expect(reader.errors.some((error) => error.code === "shape_rule_not_constant")).toBe(false);
  });

  it("extends a base default spread from `this.<field>` in an override", () => {
    expect(field("Limits", "levels")?.default?.value).toEqual(["tenant", "location"]);
    expect(field("Limits", "errors")?.default?.value).toEqual({ enabled: false, sampled: true });
    expect(reader.errors.some((error) => error.code === "shape_default_not_constant")).toBe(false);
  });
});

/** Stand-in packages: one ships `X$` from `.` and `./contracts`, one ships none (its `ScopeRef$` lives in the first). */
const SHIPPED_SOURCES: Readonly<Record<string, string>> = {
  "node_modules/@stackra/geo-fixture/package.json": JSON.stringify({
    name: "@stackra/geo-fixture",
    exports: {
      ".": { types: "./index.d.ts" },
      "./contracts": { types: "./contracts.d.ts" },
    },
  }),
  "node_modules/@stackra/geo-fixture/index.d.ts": [
    "export interface Address { line1: string }",
    "export type Condition = { all: Condition[] } | { fact: string };",
    "export declare const Address$: unknown;",
    "declare const CONDITION_SCHEMA: unknown;",
    "export { CONDITION_SCHEMA as Condition$ };",
    "export declare const ScopeRef$: unknown;",
    "",
  ].join("\n"),
  "node_modules/@stackra/geo-fixture/contracts.d.ts": [
    'export type Audience = "all" | "staff";',
    "export declare const Audience$: unknown;",
    "",
  ].join("\n"),
  "node_modules/@stackra/kernel-fixture/package.json": JSON.stringify({
    name: "@stackra/kernel-fixture",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/kernel-fixture/index.d.ts": [
    "export interface ScopeRef { id: string }",
    "export interface Plain { id: string }",
    "",
  ].join("\n"),
  "src/core/schemas/site.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    'import type { Address, Condition } from "@stackra/geo-fixture";',
    'import type { Audience } from "@stackra/geo-fixture/contracts";',
    'import type { Plain, ScopeRef } from "@stackra/kernel-fixture";',
    "",
    "export class Site extends Schema {",
    "  address!: Address;",
    "  rule!: Condition;",
    "  audience!: Audience | null;",
    "  scopes!: ScopeRef[];",
    "  plain!: Plain;",
    "}",
    "",
  ].join("\n"),
};

describe("createSourceReader on fields typed with a package's shipped schema", async () => {
  const root = writeFixtureMember("shipped", SHIPPED_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const shapes = reader.sources.flatMap((file) => reader.shapes(file));
  host.close();
  const field = (name: string) =>
    shapes
      .find((candidate) => candidate.name === "Site")
      ?.fields.find((candidate) => candidate.name === name);

  it("reads an interface, an alias union and a contracts alias as `shipped` from their entry", () => {
    expect(field("address")?.type).toEqual({
      kind: "shipped",
      name: "Address",
      from: "@stackra/geo-fixture",
    });
    expect(field("rule")?.type).toEqual({
      kind: "shipped",
      name: "Condition",
      from: "@stackra/geo-fixture",
    });
    expect(field("audience")?.type).toEqual({
      kind: "shipped",
      name: "Audience",
      from: "@stackra/geo-fixture/contracts",
    });
    expect(field("audience")?.nullable).toBe(true);
  });

  it("finds a schema another package ships for the type", () => {
    expect(field("scopes")?.type).toEqual({
      kind: "array",
      element: { kind: "shipped", name: "ScopeRef", from: "@stackra/geo-fixture" },
    });
  });

  it("still refuses a package type nobody ships a schema for, and only that one", () => {
    const unknown = reader.errors.filter((error) => error.code === "shape_unknown_type");
    expect(unknown.map((error) => error.subject)).toEqual(["Site.plain"]);
  });
});

/** A hatch that uses an imported helper, and files that import generated clients (STA-1293). */
const IMPORT_SOURCES: Readonly<Record<string, string>> = {
  "src/core/schemas/origin.schema.ts": [
    'import { countryCode, Field, Schema } from "@stackra/validation";',
    'import { z as zed } from "zod";',
    "",
    "export class Origin extends Schema {",
    "  // reason: the region check is countryCode()'s",
    "  @Field(countryCode().nullable())",
    "  country: string | null = null;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/link.schema.ts": [
    'import type { Url } from "@stackra/contracts";',
    'import { Field, Schema } from "@stackra/validation";',
    'import { type ZodType, z } from "zod";',
    "",
    "export class Link extends Schema {",
    "  // reason: any absolute URL the type allows",
    '  @Field(z.custom<Url>((value) => typeof value === "string") as ZodType<Url>)',
    "  href!: Url;",
    "}",
    "",
  ].join("\n"),
  "src/core/functions/storefront.function.ts": [
    'import { StorefrontSearchQuery } from "#stackra/clients/channels";',
    "export const storefront = () => StorefrontSearchQuery;",
    "",
  ].join("\n"),
  "src/core/functions/__tests__/storefront.function.test.ts": [
    'import { WishlistView } from "#stackra/clients/customers";',
    'import { StorefrontSearchQuery } from "#stackra/clients/channels";',
    "export const used = [WishlistView, StorefrontSearchQuery];",
    "",
  ].join("\n"),
};

describe("createSourceReader on hatch and client imports", async () => {
  const root = writeFixtureMember("imports", IMPORT_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const shapes = reader.sources.flatMap((file) => reader.shapes(file));
  const clientImports = reader.clientImports();
  host.close();

  it("carries the named imports a hatch's source uses, and only those", () => {
    const country = shapes.find((shape) => shape.name === "Origin")?.fields[0];
    expect(country?.nullable).toBe(true);
    expect(country?.type).toEqual({
      kind: "hatch",
      source: "countryCode().nullable()",
      imports: [["countryCode", "@stackra/validation"]],
    });
  });

  it("marks the type-only imports a hatch's source uses", () => {
    expect(shapes.find((shape) => shape.name === "Link")?.fields[0]?.type).toMatchObject({
      kind: "hatch",
      imports: [
        ["Url", "@stackra/contracts", true],
        ["ZodType", "zod", true],
        ["z", "zod"],
      ],
    });
  });

  it("lists each service any own file imports a client from, tests included, at its first file", () => {
    expect(clientImports).toEqual([
      { service: "channels", file: "src/core/functions/__tests__/storefront.function.test.ts" },
      { service: "customers", file: "src/core/functions/__tests__/storefront.function.test.ts" },
    ]);
  });
});

/** A package config over an options class, overridden by the member (OS console telemetry, tenancy scope; STA-1296). */
const OVERRIDE_SOURCES: Readonly<Record<string, string>> = {
  "node_modules/@stackra/telemetry-fixture/package.json": JSON.stringify({
    name: "@stackra/telemetry-fixture",
    exports: { ".": { "@stackra/source": "./index.ts" } },
  }),
  "node_modules/@stackra/telemetry-fixture/index.ts": [
    'import { Config } from "@stackra/config";',
    'import { Schema } from "@stackra/validation";',
    "",
    "export class TelemetryOptions extends Schema {",
    "  errors: { enabled: boolean; sampleRate: number } = { enabled: false, sampleRate: 1 };",
    '  levels: string[] = ["platform"];',
    "  scopes: { key: string }[] = [];",
    "  hint: string | null = null;",
    "}",
    "",
    "export class TelemetryConfig extends Config({ schema: TelemetryOptions }) {}",
    "",
    'export const TENANT_LEVEL: { key: string } = Object.freeze({ key: "tenant" });',
    "",
  ].join("\n"),
  "src/config/telemetry.config.ts": [
    'import { TENANT_LEVEL, TelemetryConfig as BaseTelemetryConfig } from "@stackra/telemetry-fixture";',
    'import { I18n } from "#stackra/i18n";',
    "",
    "export class TelemetryConfig extends BaseTelemetryConfig {",
    "  override errors = { ...this.errors, enabled: true };",
    '  override levels: BaseTelemetryConfig["levels"] = [...this.levels, "tenant"];',
    "  override scopes = [...this.scopes, TENANT_LEVEL];",
    "  override hint = I18n.pages.settings.hint;",
    "}",
    "",
  ].join("\n"),
};

describe("createSourceReader on a package config override", async () => {
  const root = writeFixtureMember("override", OVERRIDE_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const shapes = reader.sources.flatMap((file) => reader.shapes(file));
  host.close();
  const field = (name: string) =>
    shapes
      .find((candidate) => candidate.name === "TelemetryConfig")
      ?.fields.find((candidate) => candidate.name === name);

  it("takes each overridden field from the options class, with no type refusal", () => {
    expect(shapes.find((candidate) => candidate.name === "TelemetryConfig")?.base).toEqual({
      kind: "package",
      name: "TelemetryConfig",
      from: "@stackra/telemetry-fixture",
    });
    expect(field("levels")?.type).toEqual({ kind: "array", element: { kind: "string" } });
    expect(reader.errors.some((error) => error.code === "shape_unknown_type")).toBe(false);
  });

  it("extends the options class's defaults through `this.<field>` and reads shared constants", () => {
    expect(field("errors")?.default?.value).toEqual({ enabled: true, sampleRate: 1 });
    expect(field("levels")?.default?.value).toEqual(["platform", "tenant"]);
    expect(field("scopes")?.default?.value).toEqual([{ key: "tenant" }]);
    expect(field("hint")?.default?.value).toBe("pages::settings.hint");
    expect(reader.errors.some((error) => error.code === "shape_default_not_constant")).toBe(false);
  });
});

/** A member that never imports the package shipping the schema of a type it uses (STA-1296). */
const DISK_SOURCES: Readonly<Record<string, string>> = {
  "package.json": JSON.stringify({
    name: "@fixture/ledger",
    version: "1.0.0",
    type: "module",
    dependencies: { "@stackra/ledger-ship-fixture": "workspace:*" },
  }),
  "node_modules/@stackra/ledger-kernel-fixture/package.json": JSON.stringify({
    name: "@stackra/ledger-kernel-fixture",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/ledger-kernel-fixture/index.d.ts":
    "export interface Ledger { id: string }\n",
  "node_modules/@stackra/ledger-ship-fixture/package.json": JSON.stringify({
    name: "@stackra/ledger-ship-fixture",
    exports: { ".": { types: "./index.d.ts" } },
  }),
  "node_modules/@stackra/ledger-ship-fixture/index.d.ts": [
    "declare const LEDGER_SCHEMA: unknown;",
    "export { LEDGER_SCHEMA as Ledger$, type LEDGER_SCHEMA as Hidden$ };",
    "",
  ].join("\n"),
  "src/core/schemas/book.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    'import type { Ledger } from "@stackra/ledger-kernel-fixture";',
    "",
    "export class Book extends Schema {",
    "  ledger!: Ledger;",
    "}",
    "",
  ].join("\n"),
};

describe("createSourceReader on a shipped schema the program never loaded", async () => {
  const root = writeFixtureMember("ledger", DISK_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const shapes = reader.sources.flatMap((file) => reader.shapes(file));
  host.close();

  it("finds `X$` in a declared package's barrel on disk", () => {
    expect(shapes[0]?.fields[0]?.type).toEqual({
      kind: "shipped",
      name: "Ledger",
      from: "@stackra/ledger-ship-fixture",
    });
    expect(reader.errors.some((error) => error.code === "shape_unknown_type")).toBe(false);
  });
});

/** The quality-gate forms the reader refuses (STA-1306), with stand-ins for `@stackra/panel` and `@stackra/config`. */
const GATE_SOURCES: Readonly<Record<string, string>> = {
  ...MODEL_STAND_IN,
  "node_modules/@stackra/panel/package.json": JSON.stringify({
    name: "@stackra/panel",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/panel/index.d.ts": [
    'export declare abstract class ResourceBase { protected readonly "~kind": "resource"; }',
    "export declare function Resource<M extends object>(options?: object): abstract new () => ResourceBase;",
    "",
  ].join("\n"),
  "node_modules/@stackra/config/package.json": JSON.stringify({
    name: "@stackra/config",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/config/index.d.ts":
    "export declare function Secret(name: string): (target: object, key: string) => void;\n",
  "src/node/models/customer.model.ts": [
    'import { HasPublicId, Model } from "@stackra/model";',
    "",
    'export class Customer extends Model.with(HasPublicId("cus")) {}',
    "",
  ].join("\n"),
  "src/node/models/policy.model.ts": [
    'import { HasPublicId, Model } from "@stackra/model";',
    "",
    'export class Policy extends Model.with(HasPublicId("pol")) {}',
    "",
  ].join("\n"),
  "src/node/resources/customer.resource.ts": [
    'import { Resource } from "@stackra/panel";',
    'import { Customer } from "#node/models/customer.model";',
    "",
    "export class CustomerResource extends Resource<Customer>({}) {}",
    "",
  ].join("\n"),
  "src/node/resources/order.resource.ts": [
    'import { Resource } from "@stackra/panel";',
    'import { Customer } from "#node/models/customer.model";',
    "",
    "export class OrderResource extends Resource<Customer>({}) {}",
    "",
  ].join("\n"),
  "src/core/schemas/vault-options.schema.ts": [
    'import { Secret } from "@stackra/config";',
    'import { Schema } from "@stackra/validation";',
    "",
    'const NAME = String("RESEND_API_KEY");',
    "",
    "export class VaultOptions extends Schema {",
    '  @Secret("RESEND_API_KEY")',
    "  named!: string;",
    "",
    "  @Secret(NAME)",
    "  computed!: string;",
    "",
    '  @Secret("resend-key")',
    "  lower!: string;",
    "}",
    "",
  ].join("\n"),
  "src/core/services/plain.service.ts": "export class PlainService {}\n",
};

describe("createSourceReader on the quality-gate forms (STA-1306)", async () => {
  const root = writeFixtureMember("gate", GATE_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  for (const file of reader.sources) {
    reader.classes(file);
    reader.shapes(file);
  }
  const exported = reader.sources.map((file) => reader.exports(file));
  host.close();
  const codes = [...new Set(reader.errors.map((error) => `${error.code} ${error.subject}`))];

  it("refuses a model named after a kind base", () => {
    expect(codes).toContain("kind_base_name_reserved Policy");
    expect(codes.filter((code) => code.startsWith("kind_base_name_reserved"))).toHaveLength(1);
  });

  it("refuses a resource typed against another stem's model, and only that one", () => {
    expect(codes).toContain("partner_mismatch OrderResource");
    expect(codes).not.toContain("partner_mismatch CustomerResource");
  });

  it("refuses a @Secret whose name is not a SCREAMING_SNAKE literal", () => {
    expect(codes.filter((code) => code.startsWith("secret_name_missing")).sort()).toEqual([
      "secret_name_missing VaultOptions.computed",
      "secret_name_missing VaultOptions.lower",
    ]);
  });

  it("lists each file's exported classes, kind or not", () => {
    expect(
      exported.find((file) => file.file === "src/core/services/plain.service.ts")?.classes,
    ).toEqual(["PlainService"]);
  });
});

/** A model whose field carries a product data class, with stand-ins for `DataClass`, `Classify` and `Searchable`. */
const DATA_CLASS_SOURCES: Readonly<Record<string, string>> = {
  ...MODEL_STAND_IN,
  "node_modules/@stackra/model/index.d.ts": [
    MODEL_STAND_IN["node_modules/@stackra/model/index.d.ts"] ?? "",
    "export type DecoratorFunction = (target: object, key?: string) => void;",
    'export declare const AiAudience: { readonly Never: "never"; readonly Allowed: "allowed" };',
    "export declare function DataClass(options: { readonly key: string; readonly ai: string }): abstract new () => object;",
    "export declare function Classify(dataClass: abstract new () => object): DecoratorFunction;",
    "export declare function Searchable(options: { readonly text: readonly string[] }): DecoratorFunction;",
    "",
  ].join("\n"),
  "src/node/models/clinical-note.data-class.ts": [
    'import { AiAudience, DataClass } from "@stackra/model";',
    "",
    'export class ClinicalNoteDataClass extends DataClass({ key: "clinical_note", ai: AiAudience.Never }) {}',
    "",
  ].join("\n"),
  "src/node/models/case-note.model.ts": [
    'import { Classify, HasPublicId, Model, Searchable } from "@stackra/model";',
    'import { ClinicalNoteDataClass } from "#node/models/clinical-note.data-class";',
    "",
    '@Searchable({ text: ["body"] })',
    'export class CaseNote extends Model.with(HasPublicId("csn")) {',
    "  @Classify(ClinicalNoteDataClass)",
    "  body!: string;",
    "}",
    "",
  ].join("\n"),
};

describe("createSourceReader on data classes", async () => {
  const root = writeFixtureMember("data-classes", DATA_CLASS_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const classes = reader.sources.flatMap((file) => reader.classes(file));
  host.close();

  it("carries the data class's constant effects on a @Classify facet (STA-1251)", () => {
    const facet = classes
      .find((declared) => declared.name === "CaseNote")
      ?.facets.find((candidate) => candidate.name === "Classify");
    expect(facet?.member).toBe("body");
    expect(facet?.options).toMatchObject({
      $class: "ClinicalNoteDataClass",
      dataClass: { key: "clinical_note", ai: "never" },
    });
  });
});

/** A shell slot, a fill of it and a fill gen cannot read (ADR 0438), over a stand-in @stackra/panel. */
const SLOT_SOURCES: Readonly<Record<string, string>> = {
  "node_modules/@stackra/panel/package.json": JSON.stringify({
    name: "@stackra/panel",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/panel/index.d.ts": [
    'export interface Slot<P extends object = object> { readonly key: string; readonly surface: string; readonly cardinality: "one" | "many"; readonly props?: P }',
    'export declare function defineSlot<P extends object>(options: { readonly key: string; readonly surface: string; readonly cardinality?: "one" | "many" }): Slot<P>;',
    "export declare function fillSlot<P extends object>(slot: Slot<P>, component: (props: P) => unknown, options: { readonly surface: string }): { readonly slot: Slot<P> };",
    "",
  ].join("\n"),
  "src/core/types/brand-panel-props.type.ts":
    "export interface BrandPanelProps { readonly brand: string; readonly tagline?: string }\n",
  "src/core/slots/brand-panel.slot.ts": [
    'import { defineSlot } from "@stackra/panel";',
    'import type { BrandPanelProps } from "#core/types/brand-panel-props.type";',
    'export const BrandPanel = defineSlot<BrandPanelProps>({ key: "auth.sign_in.brand_panel", surface: "console" });',
    "",
  ].join("\n"),
  "src/core/fills/mezzora-brand.fill.ts": [
    'import { fillSlot } from "@stackra/panel";',
    'import { BrandPanel } from "#core/slots/brand-panel.slot";',
    'export const MezzoraBrand = fillSlot(BrandPanel, (props) => props.brand, { surface: "console" });',
    "",
  ].join("\n"),
  "src/core/fills/loose.fill.ts": [
    'import { fillSlot } from "@stackra/panel";',
    'import { BrandPanel } from "#core/slots/brand-panel.slot";',
    'const surface = String("console");',
    "export const Loose = fillSlot(BrandPanel, () => null, { surface });",
    "",
  ].join("\n"),
};

describe("createSourceReader on shell slots and fills", async () => {
  const root = writeFixtureMember("console-ui", SLOT_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const slots = reader.sources.flatMap((file) => reader.slots(file));
  const fills = reader.sources.flatMap((file) => reader.fills(file));
  host.close();

  it("reads a defineSlot's options, import path and props record", () => {
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({
      name: "BrandPanel",
      file: "src/core/slots/brand-panel.slot.ts",
      importPath: "#core/slots/brand-panel.slot",
      key: "auth.sign_in.brand_panel",
      surface: "console",
      cardinality: "one",
    });
    expect(Object.keys(slots[0]?.props ?? {})).toEqual(["brand", "tagline?"]);
    expect(slots[0]?.props["brand"]).toBe("string");
  });

  it("reads a fill's slot by its import, its surface and the slot's props", () => {
    expect(fills.map((fill) => fill.name)).toEqual(["MezzoraBrand"]);
    expect(fills[0]).toMatchObject({
      file: "src/core/fills/mezzora-brand.fill.ts",
      slot: { name: "BrandPanel", from: "#core/slots/brand-panel.slot" },
      surface: "console",
    });
    expect(fills[0]?.props).toEqual(slots[0]?.props);
  });

  it("refuses a fill whose surface is not a constant", () => {
    expect(
      reader.errors
        .filter((error) => error.code === "slot_options_not_constant")
        .map((error) => error.subject),
    ).toEqual(["Loose"]);
  });
});

/** A form over consumed shapes, a `Settings.pick` schema and a default naming a renamed enum case (STA-1363). */
const REMOTE_SOURCES: Readonly<Record<string, string>> = {
  // `#stackra/*` resolves to `.stackra/gen/*`, as in a real member's imports map.
  "package.json": JSON.stringify({
    name: "@fixture/console",
    version: "1.0.0",
    type: "module",
    dependencies: {
      "@stackra/clients": "workspace:*",
      "@stackra/contracts": "workspace:*",
      "@stackra/validation": "workspace:*",
    },
    imports: {
      "#core/*": ["./src/core/*.ts"],
      "#contracts/*": ["./src/contracts/*.ts"],
      "#stackra/*": ["./.stackra/gen/*.ts"],
    },
  }),
  "node_modules/@stackra/clients/package.json": JSON.stringify({
    name: "@stackra/clients",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/clients/index.d.ts":
    "export declare function remoteShape<S>(name: string, schema: S): abstract new () => { readonly lines: readonly string[]; readonly note: string };\n",
  ".stackra/gen/clients/commerce.ts": [
    'import { remoteShape } from "@stackra/clients";',
    "const CreateOrderInput$ = {};",
    "const RequestedLine$ = {};",
    'export class CreateOrderInput extends remoteShape("orders.CreateOrderInput", CreateOrderInput$) {}',
    'export class RequestedLine extends remoteShape("orders.RequestedLine", RequestedLine$) {}',
    "",
  ].join("\n"),
  "src/core/schemas/quick-order-form.schema.ts": [
    'import { Int, PickType } from "@stackra/validation";',
    'import { CreateOrderInput } from "#stackra/clients/commerce";',
    'export class QuickOrderForm extends PickType(CreateOrderInput, ["lines"]) {',
    "  @Int({ min: 0 })",
    "  redeemPoints = 0;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/create-order-form.schema.ts": [
    'import { RequestedLine } from "#stackra/clients/commerce";',
    "export class CreateOrderForm extends RequestedLine {",
    "  express!: boolean;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/scope-settings.schema.ts": [
    'import { Settings } from "#stackra/settings";',
    "export class ScopeSettings extends Settings.pick([Settings.orders.customersMayCancel]) {}",
    "",
  ].join("\n"),
  "src/contracts/enums/query-scope.enum.ts": [
    'import { Enum } from "@stackra/contracts";',
    'export const QueryScope = Enum.of({ Scope: "scope", Global: "global" });',
    "export type QueryScope = Enum.Value<typeof QueryScope>;",
    "",
  ].join("\n"),
  "src/core/schemas/scoped-query.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    'import { QueryScope } from "#contracts/enums/query-scope.enum";',
    "export class ScopedQuery extends Schema {",
    "  scope: QueryScope = QueryScope.ActiveScope;",
    "}",
    "",
  ].join("\n"),
};

describe("createSourceReader on remote shapes, Settings.pick and renamed enum cases (STA-1363)", async () => {
  const root = writeFixtureMember("console", REMOTE_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const classes = reader.sources.flatMap((file) => reader.classes(file));
  const shapes = reader.sources.flatMap((file) => reader.shapes(file));
  host.close();

  it("reads a PickType of a remote shape as a remote base with its derivation", () => {
    const form = shapes.find((shape) => shape.name === "QuickOrderForm");
    expect(form?.kind).toBe("schema");
    expect(form?.base).toEqual({
      kind: "remote",
      name: "CreateOrderInput",
      from: "#stackra/clients/commerce",
      derive: { helper: "PickType", keys: ["lines"] },
    });
    expect(form?.fields.map((field) => field.name)).toEqual(["redeemPoints"]);
  });

  it("reads a form that extends a remote shape as a remote base with its own fields", () => {
    const form = shapes.find((shape) => shape.name === "CreateOrderForm");
    expect(form?.base).toEqual({
      kind: "remote",
      name: "RequestedLine",
      from: "#stackra/clients/commerce",
    });
    expect(form?.fields.map((field) => field.name)).toEqual(["express"]);
  });

  it("reads Settings.pick of #stackra/settings as a schema kind; a key no own settings class declares is refused", () => {
    expect(classes.find((declared) => declared.name === "ScopeSettings")?.kind).toBe("schema");
    expect(shapes.some((shape) => shape.name === "ScopeSettings")).toBe(false);
    // stackra-209: `orders` is no module of this member, so its key does not resolve.
    expect(reader.errors.map((error) => `${error.code} ${error.subject}`)).toContain(
      "settings_key_unresolved ScopeSettings",
    );
  });

  it("reports a missing enum case as unresolved, not as a non-constant default", () => {
    const codes = reader.errors.map((error) => `${error.code} ${error.subject}`);
    expect(codes).toContain("shape_default_member_unresolved ScopedQuery.scope");
    expect(codes).not.toContain("shape_default_not_constant ScopedQuery.scope");
  });

  it("registers every class in a kind file, so none is an unregistered base", () => {
    expect(classes.map((declared) => declared.name).sort()).toEqual([
      "CreateOrderForm",
      "QuickOrderForm",
      "ScopeSettings",
      "ScopedQuery",
    ]);
  });
});

/** Settings classes with a section, and `Settings.pick` forms over their keys (stackra-209). */
const SETTINGS_SOURCES: Readonly<Record<string, string>> = {
  "node_modules/@stackra/settings/package.json": JSON.stringify({
    name: "@stackra/settings",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/settings/index.d.ts": [
    "export declare function Settings(options: { readonly scopes: readonly string[] }): abstract new () => object;",
    "export type DecoratorFunction = (target: object, property: string) => void;",
    "export declare function Setting(options?: { readonly [option: string]: unknown }): DecoratorFunction;",
    "",
  ].join("\n"),
  "src/core/orders.settings.ts": [
    'import { Int } from "@stackra/validation";',
    'import { Setting, Settings } from "@stackra/settings";',
    'import type { CancellationSection } from "#core/schemas/cancellation-section.schema";',
    'export class OrdersSettings extends Settings({ scopes: ["platform", "product"] }) {',
    "  @Setting({ client: true })",
    "  customersMayCancel = true;",
    "  @Int({ min: 1, max: 50 })",
    "  maxOpenOrders = 5;",
    "  cancellation!: CancellationSection;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/cancellation-section.schema.ts": [
    'import { Int, Schema } from "@stackra/validation";',
    "export class CancellationSection extends Schema {",
    "  @Int({ min: 0 })",
    "  windowDays = 14;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/order-policy-form.schema.ts": [
    'import { Settings } from "#stackra/settings";',
    "export class OrderPolicyForm extends Settings.pick([",
    "  Settings.orders.customersMayCancel,",
    "  Settings.orders.windowDays,",
    "]) {}",
    "",
  ].join("\n"),
  "src/core/schemas/bad-policy-form.schema.ts": [
    'import { Settings } from "#stackra/settings";',
    "export class BadPolicyForm extends Settings.pick([Settings.orders.unknownKey]) {}",
    "",
  ].join("\n"),
};

describe("createSourceReader on Settings.pick over the member's own settings (stackra-209)", async () => {
  const root = writeFixtureMember("orders", SETTINGS_SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const classes = reader.sources.flatMap((file) => reader.classes(file));
  const shapes = reader.sources.flatMap((file) => reader.shapes(file));
  host.close();

  it("reads a settings class as a settings shape with its section field and @Setting facet", () => {
    const settings = shapes.find((shape) => shape.name === "OrdersSettings");
    expect(settings?.kind).toBe("settings");
    expect(settings?.fields.map((field) => field.name)).toEqual([
      "customersMayCancel",
      "maxOpenOrders",
      "cancellation",
    ]);
    expect(settings?.fields.find((field) => field.name === "cancellation")?.type).toEqual({
      kind: "schema",
      name: "CancellationSection",
      module: "orders",
    });
    expect(classes.find((declared) => declared.name === "OrdersSettings")?.facets).toContainEqual(
      expect.objectContaining({
        name: "Setting",
        member: "customersMayCancel",
        options: { client: true },
      }),
    );
  });

  it("compiles a Settings.pick class over the picked keys, a section's key included", () => {
    const form = shapes.find((shape) => shape.name === "OrderPolicyForm");
    expect(form?.kind).toBe("schema");
    expect(form?.base).toBeUndefined();
    expect(
      form?.fields.map((field) => [field.name, field.type.kind, field.default?.value]),
    ).toEqual([
      ["customersMayCancel", "boolean", true],
      ["windowDays", "number", 14],
    ]);
    expect(form?.fields[1]?.rules).toEqual([{ name: "Int", options: { min: 0 } }]);
  });

  it("refuses a picked key no own settings class declares, and compiles no shape for it", () => {
    const codes = reader.errors.map((error) => `${error.code} ${error.subject}`);
    expect(codes).toContain("settings_key_unresolved BadPolicyForm");
    expect(codes).not.toContain("settings_key_unresolved OrderPolicyForm");
    expect(shapes.some((shape) => shape.name === "BadPolicyForm")).toBe(false);
  });
});

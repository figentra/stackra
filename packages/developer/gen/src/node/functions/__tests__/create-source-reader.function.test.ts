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
 *          `EventEnvelope` as a relay, and anything else as `listener_handle_signature` (ADR 0260 decision 4).
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
    "const LIMIT: number = 5;",
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

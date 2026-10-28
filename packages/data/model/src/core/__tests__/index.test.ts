/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/model` (with
 *          `./traits` and `./orm` folded in) is exported, nothing else is, and the template's model shapes compile
 *          and run against it.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias and the runner through @stackra/testing.
 *           The models below copy the template's declarations (orders, catalogue, loyalty-kit) without the ownership
 *           trait, which is @stackra/tenancy's `BelongsToTenant` (ADR 0321, 0323 decision 3) and tested there.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0127 2026-10-24 note.
 */
import type { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";
import { Int, Str } from "@stackra/validation";

import * as entry from "#core/index";
import {
  AppendOnly,
  Collection,
  HasPublicId,
  Index,
  ManyToMany,
  ManyToOne,
  Model,
  OnDelete,
  OneToMany,
  Searchable,
  SoftDeletes,
  Timestamps,
  Translatable,
  UserStamps,
  Versioned,
} from "#core/index";
import type { Attributes, Link, Ref, Translated } from "#core/index";

@Index(["slug"], { unique: true })
class ProductCollection extends Model.with(
  HasPublicId("pcl"),
  Timestamps,
  Translatable(["title"]),
) {
  @Str({ max: 120 })
  title!: Translated;

  @Str({ max: 64 })
  slug!: string;
}

@Index(["slug"], { unique: true })
@Searchable({
  text: ["title", "variants.sku"],
  filters: ["status", "collections.slug"],
})
class Product extends Model.with(
  HasPublicId("prd"),
  Timestamps,
  Versioned,
  Translatable(["title"]),
) {
  @Str({ max: 200 })
  title!: Translated;

  @ManyToMany(() => ProductCollection, { pivotTable: "product_collection_items" })
  collections = new Collection<ProductCollection>(this);

  @OneToMany(() => Variant, (variant) => variant.product)
  variants = new Collection<Variant>(this);
}

class Variant extends Model.with(HasPublicId("var"), Timestamps) {
  @ManyToOne(() => Product, { onDelete: OnDelete.Cascade })
  product!: Ref<Product>;

  @Str({ max: 64 })
  sku!: string;
}

@Index(["total.minor"])
class Order extends Model.with(HasPublicId("ord"), Timestamps, UserStamps, Versioned) {
  @OneToMany(() => OrderLine, (line) => line.order, { orphanRemoval: true })
  lines = new Collection<OrderLine>(this);

  total!: Money;
}

class OrderLine extends Model.with(HasPublicId("oln")) {
  @ManyToOne(() => Order, { onDelete: OnDelete.Cascade })
  order!: Ref<Order>;

  @ManyToOne(() => Variant)
  variant!: Link<Variant>;

  @Int({ min: 1 })
  quantity!: number;
}

@Index(["memberId"], {
  unique: true,
  where: "deleted_at is null",
})
class LoyaltyAccount extends Model.with(HasPublicId("lac"), SoftDeletes) {
  @Str({ max: 64 })
  memberId!: string;
}

class LedgerEntry extends Model.with(HasPublicId("lpe"), AppendOnly) {
  @ManyToOne(() => LoyaltyAccount)
  account: Ref<LoyaltyAccount> | null = null;
}

describe("@stackra/model", () => {
  it("exports exactly the runtime surface", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "AiAudience",
      "AppendOnly",
      "Archivable",
      "Classify",
      "Collection",
      "Commentable",
      "DataClass",
      "DocumentNumber",
      "EncryptedFieldsSubscriber",
      "ExportLabel",
      "HasAttachments",
      "HasCorrections",
      "HasEncryptedFields",
      "HasPublicId",
      "Index",
      "Link",
      "LinkType",
      "ManyToMany",
      "ManyToOne",
      "Meter",
      "Model",
      "ModelAddition",
      "MoneySchema",
      "OnDelete",
      "OneToMany",
      "PrivilegedDataClass",
      "SearchSnippet",
      "Searchable",
      "SoftDeletes",
      "SupportAccess",
      "Taggable",
      "Timestamps",
      "Translatable",
      "Translated",
      "TranslatedType",
      "UserStamps",
      "Versioned",
      "Visibility",
      "createTrait",
      "currentRows",
      "encryptedFieldsOf",
      "traitsOf",
    ]);
  });

  it("supports the template's model declarations", () => {
    const definition: Attributes<OrderLine> = {
      variant: "var_01jab3k4m5n6p7q8r9s0t1v2w3",
      quantity: 1,
    };
    const order = new Order();
    expect(order.id.startsWith("ord_")).toBe(true);
    expect(order.lines).toBeInstanceOf(entry.Collection);
    expect(Index.on(Order)[0]?.properties).toEqual(["total.minor"]);
    expect(Searchable.on(Product)?.filters).toEqual(["status", "collections.slug"]);
    expect(ManyToOne.members(OrderLine).get("variant")?.target()).toBe(Variant);
    expect(entry.traitsOf(LedgerEntry).map((trait) => trait.name)).toContain("append_only");
    expect(new LedgerEntry().account).toBeNull();
    expect(new LoyaltyAccount().deletedAt).toBeNull();
    expect(new ProductCollection()).toBeInstanceOf(Model);
    expect(definition.quantity).toBe(1);
  });

  it("ships the ORM pieces gen's entity metadata imports", () => {
    expect(new entry.LinkType("catalogue.variant").getColumnType()).toBe("varchar(33)");
    expect(entry.MoneySchema.meta.embeddable).toBe(true);
  });
});

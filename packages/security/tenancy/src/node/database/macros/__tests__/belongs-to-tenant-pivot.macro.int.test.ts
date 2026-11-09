/**
 * Stackra file contract:
 * Purpose: integration tests of the pivot form of `BelongsToTenantMacro` with MikroORM's own many-to-many write on
 *          real Postgres: a pivot row the ORM inserts in a tenant call stores that tenant (the insert names only the
 *          two links), a role without `BYPASSRLS` sees it only as that tenant, and outside a tenant call the insert is
 *          refused, even for the superuser, instead of storing a NULL tenant.
 * Boundary: test only; integration tier (Docker through `usePostgres`). The container's user is a superuser, which row
 *           security never restricts, so each tenant call runs as `pivot_probe` (`set local role`), with `app.tenant_id`
 *           set as the tenancy driver sets it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0239 (decision 1); ADR 0327 (decision 8).
 */
import { compileMigration, Database, EntitySchema, Migration } from "@stackra/database";
import type { Blueprint, SchemaBuilder } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { Collection } from "@stackra/model";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";

const ACME = "scp_01ja0000000000000000000001";
const GLOBEX = "scp_01ja0000000000000000000003";

/** The entity manager of the running transaction. */
type EntityManager = ReturnType<Database["em"]>;

/** A public id with `prefix` and a one-character `suffix`. */
const idOf = (prefix: string, suffix: string): string => `${prefix}_01ja${"0".repeat(21)}${suffix}`;

class Tag {
  id!: string;

  tenantId!: string;

  name!: string;
}

class Post {
  id!: string;

  tenantId!: string;

  title!: string;

  tags = new Collection<Tag>(this);
}

const TagSchema = new EntitySchema<Tag>({
  class: Tag,
  schema: "blog",
  tableName: "tags",
  properties: {
    id: { type: "string", primary: true, columnType: "varchar(33)" },
    tenantId: { type: "string", fieldName: "tenant_id", columnType: "varchar(33)" },
    name: { type: "string", columnType: "varchar(64)" },
  },
});

// The shape gen emits for a model's many-to-many: the owner side, a pivot table, join columns from the naming strategy.
const PostSchema = new EntitySchema<Post>({
  class: Post,
  schema: "blog",
  tableName: "posts",
  properties: {
    id: { type: "string", primary: true, columnType: "varchar(33)" },
    tenantId: { type: "string", fieldName: "tenant_id", columnType: "varchar(33)" },
    title: { type: "string", columnType: "varchar(64)" },
    tags: { kind: "m:n", entity: () => Tag, owner: true, pivotTable: "blog.post_tags" },
  },
});

class CreateBlogMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("posts", (t: Blueprint) => {
      t.hasPublicId("pst");
      t.belongsToTenant();
      t.string("title", 64).notNull().comment("The post's title.");
    });
    schema.create("tags", (t: Blueprint) => {
      t.hasPublicId("tag");
      t.belongsToTenant();
      t.string("name", 64).notNull().comment("The tag's name.");
    });
    schema.create("post_tags", (t: Blueprint) => {
      t.belongsToTenant({ pivot: true });
      t.belongsTo("posts", { column: "post_id" }).notNull().cascadeOnDelete().comment("The post.");
      t.belongsTo("tags", { column: "tag_id" }).notNull().cascadeOnDelete().comment("Its tag.");
      t.primary(["post_id", "tag_id"]);
    });
  }
}

const postgres = usePostgres({
  entities: [PostSchema, TagSchema],
  migrations: [
    compileMigration(CreateBlogMigration, {
      schema: "blog",
      createsSchema: true,
      macros: [BelongsToTenantMacro],
    }),
  ],
});

/** The role every tenant call runs as: no login, no `BYPASSRLS`, not the tables' owner. */
const ROLE = "pivot_probe";

/** Runs `work` in one transaction as the probe role in `tenant`'s call. */
function asTenant<T>(tenant: string, work: (em: EntityManager) => Promise<T>): Promise<T> {
  return Database.current().transaction(async () => {
    const em = Database.current().em();
    await em.execute(`set local role ${ROLE}`);
    await em.execute("select set_config('app.tenant_id', ?, true)", [tenant]);
    return work(em);
  });
}

/** The pivot rows the probe role sees in `tenant`'s call. */
const pivotRows = (tenant: string) =>
  asTenant(tenant, (em) => em.execute("select post_id, tag_id, tenant_id from blog.post_tags"));

beforeAll(async () => {
  const em = postgres.database.em();
  await em.execute(`create role ${ROLE} nologin nobypassrls`);
  await em.execute(`grant usage on schema blog to ${ROLE}`);
  await em.execute(`grant select, insert, update, delete on all tables in schema blog to ${ROLE}`);
});

/** A post and a tag of `tenant`, the tag attached through the ORM's collection, flushed. */
async function tagPost(em: EntityManager, tenant: string, suffix: string): Promise<void> {
  const post = em.create(Post, { id: idOf("pst", suffix), tenantId: tenant, title: "Hello" });
  const tag = em.create(Tag, { id: idOf("tag", suffix), tenantId: tenant, name: "news" });
  post.tags.add(tag);
  await em.flush();
}

describe(BelongsToTenantMacro, () => {
  it("stores the call's tenant on a pivot row the ORM inserts, visible only in that tenant's calls", async () => {
    await asTenant(ACME, (em) => tagPost(em, ACME, "1"));

    expect(await pivotRows(ACME)).toEqual([
      { post_id: idOf("pst", "1"), tag_id: idOf("tag", "1"), tenant_id: ACME },
    ]);
    expect(await pivotRows(GLOBEX)).toEqual([]);
  });

  it("refuses the pivot insert outside a tenant call, even for a role that bypasses row security", async () => {
    await expect(
      Database.current().transaction(() => tagPost(Database.current().em(), ACME, "2")),
    ).rejects.toThrow(/null value in column "tenant_id" of relation "post_tags"/);
  });
});

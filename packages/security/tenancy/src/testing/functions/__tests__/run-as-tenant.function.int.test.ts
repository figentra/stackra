/**
 * Stackra file contract:
 * Purpose: integration tests of `runAsTenant` on real Postgres. The flush check: inside `runAsTenant(A)` a factory
 *          whose `definition()` sets `tenantId` refuses the flush with the message that names it, the same factory
 *          without that line saves the row in A, `create({ tenantId: A })` saves, and `create({ tenantId: B })` or a
 *          direct entity-manager insert of B refuses; outside `runAsTenant` nothing is checked. The tenant setting: a
 *          factory's own flush transaction inside `runAsTenant(A)` carries `app.tenant_id = A` (a trigger records it),
 *          none outside; and a role without `BYPASSRLS` writes A's row in a transaction started inside
 *          `runAsTenant(A)` and is refused the same write outside it.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The rows are written as the container's
 *           superuser, which row security never restricts, so only the check refuses a row; the policy case switches
 *           to `member_writer` (`set local role`), which has no `BYPASSRLS` and does not own the table.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0269; ADR 0239.
 */
import {
  compileMigration,
  Database,
  EntitySchema,
  Migration,
  registerModelPartners,
} from "@stackra/database";
import type { Blueprint, SchemaBuilder } from "@stackra/database";
import { Factory, usePostgres } from "@stackra/database/testing";
import type { Faker } from "@stackra/database/testing";
import { HasPublicId, Model } from "@stackra/model";
import type { Attributes } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";
import { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";
import { fakeTenantId } from "#testing/functions/fake-tenant-id.function";
import { runAsTenant } from "#testing/functions/run-as-tenant.function";

/** The tenant-owned table. */
class CreateMembersMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("members", (t: Blueprint) => {
      t.hasPublicId("mbr");
      t.belongsToTenant();
      t.string("name", 63).notNull().comment("The member's name.");
    });
  }
}

/** A tenant-owned model. */
class Member extends Model.with(HasPublicId("mbr"), BelongsToTenant) {
  name = "";
}

const MemberSchema = new EntitySchema<Member>({
  class: Member,
  schema: "presence",
  tableName: "members",
  properties: {
    id: { type: "string", primary: true, columnType: "varchar(33)" },
    tenantId: { type: "string", fieldName: "tenant_id", columnType: "varchar(33)" },
    name: { type: "string", columnType: "varchar(63)" },
  },
});

/** The factory of the bug: its definition sets a random tenant. */
class SetsTenantMemberFactory extends Factory<Member> {
  definition(faker: Faker): Attributes<Member> {
    return { name: "Mona", tenantId: faker.publicId("scp") };
  }
}

/** The same factory with the line removed. */
class MemberFactory extends Factory<Member> {
  definition(): Attributes<Member> {
    return { name: "Mona" };
  }
}

registerModelPartners([
  [SetsTenantMemberFactory, Member],
  [MemberFactory, Member],
]);

/** The role the policy case writes as: no `BYPASSRLS`, not the table's owner. */
const ROLE = "member_writer";

usePostgres({
  entities: [MemberSchema],
  migrations: [
    compileMigration(CreateMembersMigration, {
      schema: "presence",
      createsSchema: true,
      macros: [BelongsToTenantMacro],
    }),
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            // the tenant setting each insert's transaction carried, recorded by a trigger
            `alter table presence.members add column seen_tenant text`,
            `create function presence.record_seen_tenant() returns trigger language plpgsql as $$
              begin new.seen_tenant := nullif(current_setting('app.tenant_id', true), ''); return new; end $$`,
            `create trigger members_seen_tenant before insert on presence.members
              for each row execute function presence.record_seen_tenant()`,
            `create role ${ROLE} nologin nobypassrls`,
            `grant usage on schema presence to ${ROLE}`,
            `grant select, insert on presence.members to ${ROLE}`,
          ],
        },
      ],
    },
  ],
});

const A = fakeTenantId();
const B = fakeTenantId();

/** The refusal of a row created in `runAsTenant(A)`. */
const REFUSED = new RegExp(
  `^Member was created in runAsTenant\\(${A}\\) with tenantId scp_\\w+: does its factory definition\\(\\) set ` +
    "tenantId\\? Leave it to runAsTenant\\.$",
);

/** The tenant setting the insert of the row `id` ran with, as the trigger recorded it. */
async function seenTenant(id: string): Promise<string | null | undefined> {
  const rows = (await Database.current()
    .em()
    .execute('select seen_tenant from "presence"."members" where id = ?', [id])) as {
    seen_tenant: string | null;
  }[];
  return rows[0]?.seen_tenant;
}

/** Creates a member as `ROLE` in a transaction of its own. */
function createAsWriter(): Promise<Member> {
  const database = Database.current();
  return database.transaction(async () => {
    await database.em().execute(`set local role ${ROLE}`);
    return MemberFactory.new().create();
  });
}

/** The stored tenant of the row `id`. */
async function storedTenant(id: string): Promise<string | undefined> {
  const rows = (await Database.current()
    .em()
    .execute('select tenant_id from "presence"."members" where id = ?', [id])) as {
    tenant_id: string;
  }[];
  return rows[0]?.tenant_id;
}

describe("runAsTenant flush check on Postgres", () => {
  it("refuses a factory whose definition() sets tenantId", async () => {
    await expect(runAsTenant(A, () => SetsTenantMemberFactory.new().create())).rejects.toThrow(
      REFUSED,
    );
  });

  it("saves the row in the runAsTenant tenant when the definition leaves it", async () => {
    const member = await runAsTenant(A, () => MemberFactory.new().create());
    expect(member.tenantId).toBe(A);
    await expect(storedTenant(member.id)).resolves.toBe(A);
  });

  it("passes an explicit tenantId equal to the runAsTenant tenant", async () => {
    const member = await runAsTenant(A, () => MemberFactory.new().create({ tenantId: A }));
    await expect(storedTenant(member.id)).resolves.toBe(A);
  });

  it("refuses an explicit tenantId of another tenant, from create() or a direct insert", async () => {
    await expect(runAsTenant(A, () => MemberFactory.new().create({ tenantId: B }))).rejects.toThrow(
      REFUSED,
    );
    await expect(
      runAsTenant(A, async () => {
        const em = Database.current().em();
        em.persist(em.create(Member, { name: "Omar", tenantId: B }));
        await em.flush();
      }),
    ).rejects.toThrow(REFUSED);
  });

  it("checks nothing outside runAsTenant", async () => {
    const member = await SetsTenantMemberFactory.new().create();
    await expect(storedTenant(member.id)).resolves.toBe(member.tenantId);
    const other = await MemberFactory.new().create({ tenantId: B });
    await expect(storedTenant(other.id)).resolves.toBe(B);
  });
});

describe("runAsTenant tenant setting on Postgres", () => {
  it("sets app.tenant_id in a factory's own flush transaction, and nothing outside runAsTenant", async () => {
    const inside = await runAsTenant(A, () => MemberFactory.new().create());
    await expect(seenTenant(inside.id)).resolves.toBe(A);
    const outside = await MemberFactory.new().create({ tenantId: B });
    await expect(seenTenant(outside.id)).resolves.toBeNull();
  });

  it("lets a role without BYPASSRLS write the tenant's row inside runAsTenant, and refuses it outside", async () => {
    const member = await runAsTenant(A, () => createAsWriter());
    await expect(storedTenant(member.id)).resolves.toBe(A);
    await expect(createAsWriter()).rejects.toThrow();
  });
});

/**
 * Stackra file contract:
 * Purpose: integration tests of the tenant data keys on real Postgres (ADR 0188, amendment 2026-11-09), through
 *          `CallIsolationDriver` and as a role that is neither the owner nor `BYPASSRLS`: tenant B never reads tenant
 *          A's key rows, by the store or by SQL; the store refuses another tenant's id and the policy refuses a row
 *          written for another tenant; a second mint of a version keeps the first; no session updates a key; and the
 *          `kms` driver over this store gives each tenant its own key, so B never unwraps A's; each mint records
 *          `TenantDataKeyMinted` on its row.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's user is a superuser, which row
 *           security never restricts, so each call starts with `set local role stackra_probe`, created once with the
 *           rights an app session has (no UPDATE). KMS is a stand-in that binds a wrapped key to its encryption
 *           context, as AWS KMS does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0188 (decision 2 and its 2026-11-09 amendment); ADR 0495 (decisions 1 and 3); ADR 0239;
 *                     ADR 0182 (integration tier); ADR 0022; ADR 0269.
 */
import { buildConfig } from "@stackra/config";
import type { KmsClient } from "@stackra/config/contracts";
import type { PublicId } from "@stackra/contracts";
import { compileMigration, registerModelPartners } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import { beforeAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { TenantKeysConfig } from "#config/tenant-keys.config";
import { TenantDataKeyMinted } from "#core/events/tenant-data-key-minted.event";
import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";
import { CreateTenantDataKeysMigration } from "#node/database/migrations/0002-create-tenant-data-keys.migration";
import { CallIsolationDriver } from "#node/drivers/call-isolation.driver";
import { KmsKeyProviderDriver } from "#node/drivers/kms-key-provider.driver";
import { PostgresTenantDataKeyStoreDriver } from "#node/drivers/postgres-tenant-data-key-store.driver";
import { TENANCY_ENTITIES } from "#node/entities.gen";
import { TenantDataKey } from "#node/models/tenant-data-key.model";
import { TenantDataKeyService } from "#node/services/tenant-data-key.service";
import { TenantIsolationService } from "#node/services/tenant-isolation.service";
import { tenantActor } from "#testing/functions/tenant-actor.function";

registerModelPartners([[TenantDataKeyService, TenantDataKey]]);

const postgres = usePostgres({
  entities: [...TENANCY_ENTITIES],
  migrations: [
    compileMigration(CreateTenantDataKeysMigration, {
      schema: "tenancy",
      createsSchema: true,
      macros: [BelongsToTenantMacro],
    }),
  ],
});

/** The role every call runs as: no login, no `BYPASSRLS`, not the table's owner, no UPDATE. */
const ROLE = "stackra_probe";

const TENANT_A = "scp_01j9z3k4m5n6p7q8r9s0t1v2a1" as PublicId<"scp">;
const TENANT_B = "scp_01j9z3k4m5n6p7q8r9s0t1v2b1" as PublicId<"scp">;

beforeAll(async () => {
  const em = postgres.database.em();
  await em.execute(`create role ${ROLE} nologin nobypassrls`);
  await em.execute(`grant usage on schema "tenancy" to ${ROLE}`);
  await em.execute(`grant select, insert, delete on all tables in schema "tenancy" to ${ROLE}`);
});

/** Runs `work` as `tenant`'s call, through the real isolation, as the probe role. */
const within = <T>(tenant: PublicId<"scp">, work: () => Promise<T>): Promise<T> =>
  new CallIsolationDriver(
    postgres.database,
    new TenantIsolationService(postgres.database),
    new MemoryScopeTreeDriver(),
  ).run(
    tenantActor(tenant),
    undefined,
    async () => {
      await postgres.database.em().execute(`set local role ${ROLE}`);
      return work();
    },
    { readOnly: false },
  );

/** The store over the real table. */
const store = () => new PostgresTenantDataKeyStoreDriver(new TenantDataKeyService());

/** A stand-in KMS that opens a wrapped key only under the context it was minted with. */
function fakeKms(): KmsClient {
  const minted = new Map<string, { context: string; key: Uint8Array }>();
  return {
    generateDataKeyWithoutPlaintext: async (input: {
      EncryptionContext?: Record<string, string>;
    }) => {
      const handle = `w${minted.size + 1}`;
      minted.set(handle, {
        context: JSON.stringify(input.EncryptionContext),
        key: crypto.getRandomValues(new Uint8Array(32)),
      });
      return { CiphertextBlob: new TextEncoder().encode(handle) };
    },
    decrypt: async (input: {
      CiphertextBlob: Uint8Array;
      EncryptionContext?: Record<string, string>;
    }) => {
      const held = minted.get(new TextDecoder().decode(input.CiphertextBlob));
      if (held === undefined || held.context !== JSON.stringify(input.EncryptionContext))
        throw new Error("InvalidCiphertextException");
      return { Plaintext: held.key };
    },
  } as unknown as KmsClient;
}

describe("tenant data keys on Postgres", { timeout: 60_000 }, () => {
  it("never shows tenant A's key rows to tenant B, by the store or by SQL", async () => {
    expect(await within(TENANT_A, () => store().add(TENANT_A, { id: "k1", wrapped: "d2Fh" }))).toBe(
      true,
    );
    expect(await within(TENANT_B, () => store().list(TENANT_B))).toEqual([]);
    const rows = await within(TENANT_B, () =>
      postgres.database.em().execute('select count(*)::int as n from "tenancy"."tenant_data_keys"'),
    );
    expect(rows).toEqual([{ n: 0 }]);
    expect(await within(TENANT_A, () => store().list(TENANT_A))).toEqual([
      { id: "k1", wrapped: "d2Fh" },
    ]);
  });

  it("refuses another tenant's id in the store, and a row written for another tenant by the policy", async () => {
    await expect(within(TENANT_A, () => store().list(TENANT_B))).rejects.toThrow(
      /only inside that tenant's call/,
    );
    await expect(
      within(TENANT_A, () =>
        postgres.database
          .em()
          .execute(
            'insert into "tenancy"."tenant_data_keys" (id, tenant_id, version, key_id, wrapped) values (?, ?, 9, ?, ?)',
            ["tdk_01j9z3k4m5n6p7q8r9s0t1v2x9", TENANT_B, "k9", "d2Fh"],
          ),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("keeps the first of two mints of a version, and lets no session update a key", async () => {
    await within(TENANT_B, () => store().add(TENANT_B, { id: "k1", wrapped: "Zmlyc3Q" }));
    expect(
      await within(TENANT_B, () => store().add(TENANT_B, { id: "k1", wrapped: "c2Vjb25k" })),
    ).toBe(false);
    expect(await within(TENANT_B, () => store().list(TENANT_B))).toEqual([
      { id: "k1", wrapped: "Zmlyc3Q" },
    ]);
    await expect(
      within(TENANT_B, () =>
        postgres.database
          .em()
          .execute('update "tenancy"."tenant_data_keys" set wrapped = ? where key_id = ?', [
            "eA",
            "k1",
          ]),
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("gives each tenant its own key through the kms driver, so B never unwraps A's", async () => {
    const config = buildConfig(TenantKeysConfig, {
      values: { driver: "kms", store: "postgres", kmsKeyId: "alias/tenant-data-keys" },
    });
    const keys = new KmsKeyProviderDriver(config, fakeKms(), store());
    const tenantC = "scp_01j9z3k4m5n6p7q8r9s0t1v2c1" as PublicId<"scp">;
    const tenantD = "scp_01j9z3k4m5n6p7q8r9s0t1v2d1" as PublicId<"scp">;
    const c = await within(tenantC, () => keys.current());
    const d = await within(tenantD, () => keys.current());
    expect([c.id, d.id]).toEqual(["k1", "k1"]);
    expect(d.key).not.toEqual(c.key);
    expect(await within(tenantC, () => keys.byId("k1"))).toEqual(c);
  });

  it("records TenantDataKeyMinted on the row of each key it appends", async () => {
    const tenantE = "scp_01j9z3k4m5n6p7q8r9s0t1v2e1" as PublicId<"scp">;
    const recorded = vi.spyOn(TenantDataKey.prototype, "record");
    try {
      await within(tenantE, () => store().add(tenantE, { id: "k1", wrapped: "Zmlyc3Q" }));
      await within(tenantE, () => store().add(tenantE, { id: "k2", wrapped: "c2Vjb25k" }));
      expect(recorded.mock.calls.map(([event]) => event)).toEqual([
        expect.objectContaining({ tenantId: tenantE, keyId: "k1" }),
        expect.objectContaining({ tenantId: tenantE, keyId: "k2" }),
      ]);
      expect(recorded.mock.calls.every(([event]) => event instanceof TenantDataKeyMinted)).toBe(
        true,
      );
    } finally {
      recorded.mockRestore();
    }
  });
});

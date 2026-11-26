/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresConsentProofStoreDriver` on real Postgres, through `TenantIsolationService` and
 *          as a role that is neither the owner nor `BYPASSRLS` and holds no UPDATE: it passes the `ConsentProofStore`
 *          conformance suite; tenant B never reads tenant A's proofs, by the store or by SQL, and its own proofs of the
 *          same subject start a chain of their own; a row written for another tenant fails the policy; an append in no
 *          tenant fails closed; no session updates a proof (the service role lacks the right, and the trigger refuses
 *          even the owner); concurrent appends for one subject leave one linear chain that verifies from the stored
 *          rows; an edit made behind the table's back is found by the chain check.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's user is a superuser, which row
 *           security never restricts, so each call starts with `set local role stackra_probe`, as tenancy's isolation
 *           tests do; the role is created once with only the table rights an app session has (no UPDATE). The
 *           superuser seeds nothing and only checks.
 * Runtime: node (vitest)
 * Governing contract: ADR 0454 (decision 5); ADR 0212 (decision 3); ADR 0239; ADR 0495; ADR 0182 (integration tier);
 *                     ADR 0022; ADR 0269; `.agents/rules/tenancy.md`; STA-2818.
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { compileMigration, repositoryOf } from "@stackra/database";
import type { Repository } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { BelongsToTenantMacro, TenantIsolationService } from "@stackra/tenancy/node";
import { tenantActor } from "@stackra/tenancy/testing";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { ConsentProofStore } from "#contracts/ports/consent-proof-store.port";
import type { ConsentProof } from "#contracts/types/consent-proof.type";
import { findConsentProofChainBreak } from "#core/functions/find-consent-proof-chain-break.function";
import type { ConsentProofLink } from "#core/types/consent-proof-link.type";
import { CreateConsentProofEntriesMigration } from "#node/database/migrations/0001-create-consent-proof-entries.migration";
import { PostgresConsentProofStoreDriver } from "#node/drivers/postgres-consent-proof-store.driver";
import { CONSENT_ENTITIES } from "#node/entities.gen";
import { ConsentProofEntry } from "#node/models/consent-proof-entry.model";
import { describeConsentProofStoreConformance } from "#testing/functions/describe-consent-proof-store-conformance.function";

const postgres = usePostgres({
  entities: [...CONSENT_ENTITIES],
  migrations: [
    compileMigration(CreateConsentProofEntriesMigration, {
      schema: "consent",
      createsSchema: true,
      macros: [BelongsToTenantMacro],
    }),
  ],
});

/** The role every call runs as: no login, no `BYPASSRLS`, not the table's owner, no UPDATE. */
const ROLE = "stackra_probe";

const SCOPE_A = "scp_01j9z3k4m5n6p7q8r9s0t1v2a1" as PublicId<"scp">;
const SCOPE_B = "scp_01j9z3k4m5n6p7q8r9s0t1v2b1" as PublicId<"scp">;

const CHILD = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1" as PublicId;

beforeAll(async () => {
  const em = postgres.database.em();
  await em.execute(`create role ${ROLE} nologin nobypassrls`);
  await em.execute(`grant usage on schema "consent" to ${ROLE}`);
  await em.execute(`grant select, insert, delete on all tables in schema "consent" to ${ROLE}`);
});

/** Runs `work` in `scope`'s call, through the real tenant isolation, as the probe role. */
const within = <T>(scope: PublicId<"scp">, work: () => Promise<T>): Promise<T> =>
  new TenantIsolationService(postgres.database).withTenant(tenantActor(scope), async () => {
    await postgres.database.em().execute(`set local role ${ROLE}`);
    return work();
  });

/** The real driver over the real table. */
const driver = () =>
  new PostgresConsentProofStoreDriver(
    Reflect.construct(repositoryOf(ConsentProofEntry), []) as Repository<ConsentProofEntry>,
    postgres.database,
  );

/** The driver, with every call in `scope`'s isolation run. */
class IsolatedStore extends Driver(ConsentProofStore) {
  private readonly scope: PublicId<"scp">;

  constructor(scope: PublicId<"scp">) {
    super();
    this.scope = scope;
  }

  append(proof: ConsentProof): Promise<void> {
    return within(this.scope, () => driver().append(proof));
  }

  latest(subject: PublicId, document: string): Promise<ConsentProof | undefined> {
    return within(this.scope, () => driver().latest(subject, document));
  }

  list(subject: PublicId): Promise<readonly ConsentProof[]> {
    return within(this.scope, () => driver().list(subject));
  }
}

/** The store as `scope`'s session. */
const as = (scope: PublicId<"scp">) => new IsolatedStore(scope);

/** `CHILD`'s own answer to `version` of the terms at `at`. */
const termsOf = (version: string, at: string): ConsentProof => ({
  subject: CHILD,
  givenBy: CHILD,
  document: "terms",
  version,
  granted: true,
  at,
});

/** The superuser's read of `scope`'s stored links of `subject`, oldest first, past row security. */
async function storedLinks(scope: string, subject: string): Promise<ConsentProofLink[]> {
  const rows = (await postgres.database
    .em()
    .execute(
      'select subject, given_by, relationship, document, version, content_hash, granted, "at", channel, ' +
        "verification_method, verification_reference, sequence, previous_hash, hash " +
        'from "consent"."consent_proof_entries" where tenant_id = ? and subject = ? order by sequence',
      [scope, subject],
    )) as Record<string, unknown>[];
  return rows.map((row) => {
    const optional = (key: string, column: string) =>
      row[column] === null ? {} : { [key]: row[column] as string };
    return {
      subject: row.subject as PublicId,
      givenBy: row.given_by as PublicId,
      ...optional("relationship", "relationship"),
      document: row.document as string,
      version: row.version as string,
      ...optional("contentHash", "content_hash"),
      granted: row.granted as boolean,
      at: new Date(row.at as string).toISOString(),
      ...optional("channel", "channel"),
      ...optional("verificationMethod", "verification_method"),
      ...optional("verificationReference", "verification_reference"),
      sequence: Number(row.sequence),
      previousHash: row.previous_hash as string,
      hash: row.hash as string,
    } as ConsentProofLink;
  });
}

describeConsentProofStoreConformance("PostgresConsentProofStoreDriver", () => as(SCOPE_A));

describe(PostgresConsentProofStoreDriver, { timeout: 60_000 }, () => {
  it("never shows tenant A's proofs to tenant B, by the store or by SQL", async () => {
    await as(SCOPE_A).append(termsOf("1", "2026-11-26T09:00:00.000Z"));
    expect(await as(SCOPE_B).list(CHILD)).toEqual([]);
    expect(await as(SCOPE_B).latest(CHILD, "terms")).toBeUndefined();
    expect(
      await within(SCOPE_B, () =>
        postgres.database
          .em()
          .execute('select count(*)::int as n from "consent"."consent_proof_entries"'),
      ),
    ).toEqual([{ n: 0 }]);
    expect(await as(SCOPE_A).list(CHILD)).toEqual([termsOf("1", "2026-11-26T09:00:00.000Z")]);
  });

  it("starts tenant B's own chain for the same subject, apart from tenant A's", async () => {
    await as(SCOPE_B).append(termsOf("7", "2026-11-26T09:30:00.000Z"));
    const [first] = await storedLinks(SCOPE_B, CHILD);
    expect(first).toMatchObject({ version: "7", sequence: 1, previousHash: "0".repeat(64) });
    expect((await as(SCOPE_A).list(CHILD)).map((proof) => proof.version)).not.toContain("7");
  });

  it("refuses a row written for another tenant, and an append in no tenant", async () => {
    await expect(
      within(SCOPE_B, () =>
        postgres.database
          .em()
          .execute(
            'insert into "consent"."consent_proof_entries" (id, tenant_id, subject, given_by, document, version, ' +
              'granted, "at", sequence, previous_hash, hash) values (?, ?, ?, ?, ?, ?, true, now(), 99, ?, ?)',
            [
              "cpf_01j9z3k4m5n6p7q8r9s0t1v2x9",
              SCOPE_A,
              CHILD,
              CHILD,
              "terms",
              "9",
              "0".repeat(64),
              "0".repeat(64),
            ],
          ),
      ),
    ).rejects.toThrow(/row-level security/i);
    await expect(
      postgres.database.transaction(async () => {
        await postgres.database.em().execute(`set local role ${ROLE}`);
        await driver().append(termsOf("9", "2026-11-26T09:45:00.000Z"));
      }),
    ).rejects.toThrow();
    expect((await storedLinks(SCOPE_A, CHILD)).map((link) => link.version)).not.toContain("9");
  });

  it("lets no session update a proof: the service role lacks the right, and the trigger refuses the owner", async () => {
    await expect(
      within(SCOPE_A, () =>
        postgres.database
          .em()
          .execute(
            'update "consent"."consent_proof_entries" set granted = false where subject = ?',
            [CHILD],
          ),
      ),
    ).rejects.toThrow(/permission denied/i);
    await expect(
      postgres.database
        .em()
        .execute('update "consent"."consent_proof_entries" set granted = false where subject = ?', [
          CHILD,
        ]),
    ).rejects.toThrow(/append-only/);
    expect((await as(SCOPE_A).list(CHILD)).every((proof) => proof.granted)).toBe(true);
  });

  it("keeps one linear chain under concurrent appends, which verifies from the stored rows", async () => {
    const subject = "usr_01j9z3k4m5n6p7q8r9s0t1v2k1" as PublicId;
    await Promise.all(
      ["1", "2", "3", "4"].map((version) =>
        as(SCOPE_A).append({
          ...termsOf(version, `2026-11-26T1${version}:00:00.000Z`),
          subject,
          givenBy: subject,
        }),
      ),
    );
    const links = await storedLinks(SCOPE_A, subject);
    expect(links.map((link) => link.sequence)).toEqual([1, 2, 3, 4]);
    expect(new Set(links.map((link) => link.version)).size).toBe(4);
    expect(await findConsentProofChainBreak(links)).toBeUndefined();
  });

  it("finds an edit made behind the table's back", async () => {
    const links = await storedLinks(SCOPE_A, CHILD);
    expect(await findConsentProofChainBreak(links)).toBeUndefined();
    const [first, ...rest] = links;
    expect(
      await findConsentProofChainBreak([
        { ...(first as ConsentProofLink), granted: false },
        ...rest,
      ]),
    ).toBe(1);
  });
});

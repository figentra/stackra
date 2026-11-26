/**
 * Stackra file contract:
 * Purpose: `PostgresConsentProofStoreDriver`, the durable `ConsentProofStore`: each appended proof becomes the next
 *          `ConsentProofEntry` of its subject's hash chain in the tenant of the running call, and reads return the
 *          proofs exactly as written.
 * Boundary: implements the port only, insert and read: it has no update or delete (the table refuses UPDATE; erasure is
 *           the owning service's retention DELETE). Every statement runs in the caller's transaction and tenant (the
 *           call's isolation run), so the forced tenant policy limits reads to that tenant and an append outside any
 *           tenant fails closed. Each attempt runs in a savepoint of the caller's transaction (`database.transaction`),
 *           so the proof commits or rolls back with the answer's own work: the head is the subject's highest sequence;
 *           two writers that read the same head collide on the unique (tenant, subject, sequence) index, and the loser
 *           rolls back its savepoint, reads the new head and tries again, up to five times, then refuses with
 *           `ConsentProofWriteFailedError`. Any other failure propagates. The generated wiring loads this driver lazily,
 *           so it never reaches a browser bundle.
 * Runtime: node
 * Governing contract: ADR 0454 (decision 5: consent evidence records); ADR 0298 (decision 3); ADR 0212 (decision 3);
 *                     ADR 0239 (equality on `tenant_id`); ADR 0136 (decision 2: one transaction per action); ADR 0294
 *                     (decisions 15 and 16); ADR 0263; STA-2818.
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { UniqueViolation } from "@stackra/database";
import type { Database, Repository } from "@stackra/database";

import { ConsentProofStore } from "#contracts/ports/consent-proof-store.port";
import type { ConsentProof } from "#contracts/types/consent-proof.type";
import { ConsentProofWriteFailedError } from "#core/errors/consent-proof-write-failed.error";
import { linkConsentProof } from "#core/functions/link-consent-proof.function";
import type { ConsentProofEntry } from "#node/models/consent-proof-entry.model";

/** How many times an append reads the head and inserts before it gives up. */
const ATTEMPTS = 5;

/** The proof a stored entry holds, without its chain columns or nulls. */
function proofOf(entry: ConsentProofEntry): ConsentProof {
  return {
    subject: entry.subject as PublicId,
    givenBy: entry.givenBy as PublicId,
    ...(entry.relationship === null ? {} : { relationship: entry.relationship }),
    document: entry.document,
    version: entry.version,
    ...(entry.contentHash === null ? {} : { contentHash: entry.contentHash }),
    granted: entry.granted,
    at: new Date(entry.at).toISOString(),
    ...(entry.channel === null ? {} : { channel: entry.channel }),
    ...(entry.verificationMethod === null ? {} : { verificationMethod: entry.verificationMethod }),
    ...(entry.verificationReference === null
      ? {}
      : { verificationReference: entry.verificationReference }),
  };
}

/**
 * Stores consent proofs in Postgres, one hash chain per subject.
 *
 * @example
 * container.bind(ConsentProofStore, PostgresConsentProofStoreDriver);
 */
export class PostgresConsentProofStoreDriver extends Driver(ConsentProofStore) {
  /** The consent proof table, tenant-scoped by its policy. */
  private readonly entries: Repository<ConsentProofEntry>;

  /** The service's database, for each attempt's savepoint. */
  private readonly database: Database;

  /**
   * @param entries - the consent proof table, tenant-scoped by its policy.
   * @param database - the service's database.
   */
  constructor(entries: Repository<ConsentProofEntry>, database: Database) {
    super();
    this.entries = entries;
    this.database = database;
  }

  /**
   * Appends `proof` to its subject's chain in the running tenant.
   *
   * @throws ConsentProofWriteFailedError when the head kept moving under concurrent writers.
   * @throws RangeError when `proof.at` is not an instant.
   */
  async append(proof: ConsentProof): Promise<void> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        await this.database.transaction(() => this.insertAfterHead(proof));
        return;
      } catch (error) {
        if (!(error instanceof UniqueViolation)) throw error;
        if (attempt >= ATTEMPTS) throw ConsentProofWriteFailedError.create({}, { cause: error });
      }
    }
  }

  /** The latest proof of `subject` for `document`, any version. */
  async latest(subject: PublicId, document: string): Promise<ConsentProof | undefined> {
    const entry = await this.entries.findOne(
      { subject, document },
      { orderBy: { sequence: "desc" } },
    );
    return entry === null ? undefined : proofOf(entry);
  }

  /** Every proof of `subject`, oldest first. */
  async list(subject: PublicId): Promise<readonly ConsentProof[]> {
    const entries = await this.entries.find({ subject }, { orderBy: { sequence: "asc" } });
    return entries.map(proofOf);
  }

  /** Links `proof` after its subject's current head and inserts it. */
  private async insertAfterHead(proof: ConsentProof): Promise<void> {
    const head = await this.entries.findOne(
      { subject: proof.subject },
      { orderBy: { sequence: "desc" } },
    );
    const link = await linkConsentProof(proof, head ?? undefined);
    await this.entries.insert({
      subject: link.subject,
      givenBy: link.givenBy,
      relationship: link.relationship ?? null,
      document: link.document,
      version: link.version,
      contentHash: link.contentHash ?? null,
      granted: link.granted,
      at: new Date(link.at),
      channel: link.channel ?? null,
      verificationMethod: link.verificationMethod ?? null,
      verificationReference: link.verificationReference ?? null,
      sequence: link.sequence,
      previousHash: link.previousHash,
      hash: link.hash,
    });
  }
}

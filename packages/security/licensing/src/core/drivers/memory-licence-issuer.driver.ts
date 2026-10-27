/**
 * Stackra file contract:
 * Purpose: `MemoryLicenceIssuerDriver`, the `LicenceIssuer` in the process, for dev stacks and tests: licences live in
 *          a map, and a check-out returns an unsigned stand-in file that carries the licence as JSON so a test can read
 *          what a real file would embed.
 * Boundary: named `memory` by its file prefix; `IssuerConfig.driver` picks it in dev and preview. Never where a customer
 *           installs the file: its files do not pass `verifyLicenceFile`. An unknown id is ignored (update, suspend) or
 *           checked out as an empty licence, as the memory drivers of other ports do.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (drivers); ADR 0266 (memory first); ADR 0178.
 */
import { Driver } from "@stackra/container";
import type { Json } from "@stackra/contracts";

import { LicenceIssuer } from "#core/ports/licence-issuer.port";
import type { LicenceDraft } from "#core/types/licence-draft.type";

/** One held licence. */
interface HeldLicence {
  expiry: Date;
  metadata: Readonly<Record<string, Json>>;
  suspended: boolean;
}

/**
 * Licences in a map.
 *
 * @example
 * const issuer = new MemoryLicenceIssuerDriver();
 * const id = await issuer.create(draft); // "mem_1"
 */
export class MemoryLicenceIssuerDriver extends Driver(LicenceIssuer) {
  /** Licence id to licence; a test reads it. */
  readonly licences = new Map<string, HeldLicence>();

  /** Stores the licence; returns `mem_<n>`. */
  async create(draft: LicenceDraft): Promise<string> {
    const id = `mem_${this.licences.size + 1}`;
    this.licences.set(id, { expiry: draft.expiry, metadata: draft.metadata, suspended: false });
    return id;
  }

  /** Replaces the expiry and metadata. */
  async update(id: string, draft: Pick<LicenceDraft, "expiry" | "metadata">): Promise<void> {
    const held = this.licences.get(id);
    if (held !== undefined) Object.assign(held, { expiry: draft.expiry, metadata: draft.metadata });
  }

  /** A stand-in file: the JSON of the licence between armour lines. */
  async checkOut(id: string, _ttlSeconds: number | undefined): Promise<string> {
    const held = this.licences.get(id);
    const body = JSON.stringify({
      id,
      expiry: held?.expiry.toISOString() ?? null,
      suspended: held?.suspended ?? false,
      metadata: held?.metadata ?? {},
    });
    return `-----BEGIN MEMORY LICENSE FILE-----\n${body}\n-----END MEMORY LICENSE FILE-----\n`;
  }

  /** Marks it suspended. */
  async suspend(id: string): Promise<void> {
    const held = this.licences.get(id);
    if (held !== undefined) held.suspended = true;
  }
}

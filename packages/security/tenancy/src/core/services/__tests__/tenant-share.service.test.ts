/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantShareService` over `MemoryTenantSharesDriver`: a proposal needs two tenants and an item
 *          kind; only the receiver accepts or declines a proposed share; either party revokes; items flow by events
 *          only on an active in-region share that lists their kind; a cross-region item is released by the proposer
 *          only, after the transfer rules allow it.
 * Boundary: test only; a fixed clock and a transfer check that allows one item kind.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0343 (decisions 1 to 5).
 */
import { Driver } from "@stackra/container";
import { Clock, type PublicId } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { MemoryTenantSharesDriver } from "#core/drivers/memory-tenant-shares.driver";
import { RevokedCopy } from "#core/enums/revoked-copy.enum";
import { ShareStatus } from "#core/enums/share-status.enum";
import { ShareTransitionInvalidError } from "#core/errors/share-transition-invalid.error";
import { TransferRefusedError } from "#core/errors/transfer-refused.error";
import { TransferCheck } from "#core/ports/transfer-check.port";
import { TenantShareService } from "#core/services/tenant-share.service";
import type { ShareProposal } from "#core/types/share-proposal.type";

/** Always 2026-10-25 09:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-10-25T09:00:00Z");
  }
}

/** Allows invoices only. */
class InvoicesOnlyTransferCheckDriver extends Driver(TransferCheck) {
  async mayRelease(_entity: PublicId, _receiver: PublicId<"scp">, kind: string): Promise<boolean> {
    return kind === "invoice";
  }
}

const FIRM = "scp_01j9z3k4m5n6p7q8r9s0t1v2f1";
const CLIENT = "scp_01j9z3k4m5n6p7q8r9s0t1v2c1";
const OTHER = "scp_01j9z3k4m5n6p7q8r9s0t1v2o1";
const SHARE = "shr_01j9z3k4m5n6p7q8r9s0t1v2s1";
const ENTITY = "len_01j9z3k4m5n6p7q8r9s0t1v2e1";

/** A proposal from the firm to the client. */
function proposal(crossRegion: boolean): ShareProposal {
  return {
    id: SHARE,
    proposer: FIRM,
    receiver: CLIENT,
    source: { kind: "matters.matter", id: "mat_01j9z3k4m5n6p7q8r9s0t1v2m1" },
    items: {
      invoice: { onRevoke: RevokedCopy.Keep, receiverWritable: false },
      document: { onRevoke: RevokedCopy.Delete, receiverWritable: false },
    },
    crossRegion,
  };
}

const target = { kind: "matters.matter", id: "mat_01j9z3k4m5n6p7q8r9s0t1v2m2" } as const;

describe("TenantShareService", () => {
  let shares: TenantShareService;

  beforeEach(() => {
    shares = new TenantShareService(
      new MemoryTenantSharesDriver(),
      new InvoicesOnlyTransferCheckDriver(),
      new FixedClockDriver(),
    );
  });

  it("refuses a share with itself, without items, or with a taken id", async () => {
    await expect(shares.propose({ ...proposal(false), receiver: FIRM })).rejects.toBeInstanceOf(
      ShareTransitionInvalidError,
    );
    await expect(shares.propose({ ...proposal(false), items: {} })).rejects.toBeInstanceOf(
      ShareTransitionInvalidError,
    );
    await shares.propose(proposal(false));
    await expect(shares.propose(proposal(false))).rejects.toBeInstanceOf(
      ShareTransitionInvalidError,
    );
  });

  it("lets only the receiver accept, and flows listed kinds inside one region", async () => {
    await shares.propose(proposal(false));
    expect(await shares.flows(SHARE, "invoice")).toBe(false);
    await expect(shares.accept(SHARE, FIRM, target)).rejects.toBeInstanceOf(
      ShareTransitionInvalidError,
    );
    const active = await shares.accept(SHARE, CLIENT, target);
    expect(active.status).toBe(ShareStatus.Active);
    expect(active.target).toEqual(target);
    expect(await shares.flows(SHARE, "invoice")).toBe(true);
    expect(await shares.flows(SHARE, "message")).toBe(false);
  });

  it("lets either party revoke, and nothing flows after", async () => {
    await shares.propose(proposal(false));
    await shares.accept(SHARE, CLIENT, target);
    await expect(shares.revoke(SHARE, OTHER)).rejects.toBeInstanceOf(ShareTransitionInvalidError);
    const revoked = await shares.revoke(SHARE, CLIENT);
    expect(revoked.status).toBe(ShareStatus.Revoked);
    expect(revoked.revokedBy).toBe(CLIENT);
    expect(await shares.flows(SHARE, "invoice")).toBe(false);
    await expect(shares.revoke(SHARE, FIRM)).rejects.toBeInstanceOf(ShareTransitionInvalidError);
  });

  it("lets the receiver decline a proposal", async () => {
    await shares.propose(proposal(false));
    expect((await shares.decline(SHARE, CLIENT)).status).toBe(ShareStatus.Declined);
    await expect(shares.accept(SHARE, CLIENT, target)).rejects.toBeInstanceOf(
      ShareTransitionInvalidError,
    );
  });

  it("releases a cross-region item only by the proposer and under the transfer rules", async () => {
    await shares.propose(proposal(true));
    await shares.accept(SHARE, CLIENT, target);
    expect(await shares.flows(SHARE, "invoice")).toBe(false);
    const invoice = { kind: "invoice", id: "inv_01j9z3k4m5n6p7q8r9s0t1v2i1" } as const;
    const release = await shares.release(SHARE, FIRM, invoice, ENTITY);
    expect(release).toEqual({
      share: SHARE,
      item: invoice,
      legalEntity: ENTITY,
      releasedAt: new Date("2026-10-25T09:00:00Z"),
    });
    await expect(shares.release(SHARE, CLIENT, invoice, ENTITY)).rejects.toBeInstanceOf(
      ShareTransitionInvalidError,
    );
    const refused = await shares
      .release(SHARE, FIRM, { kind: "document", id: "doc_01j9z3k4m5n6p7q8r9s0t1v2d1" }, ENTITY)
      .catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(TransferRefusedError);
    expect((refused as TransferRefusedError).details).toEqual({ itemKind: "document" });
  });
});

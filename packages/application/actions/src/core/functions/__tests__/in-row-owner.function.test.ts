/**
 * Stackra file contract:
 * Purpose: unit tests of `inRowOwner`: with an isolation bound the work runs through it as the caller's system actor
 *          in the row's owner (or as the platform for a row with none), never read-only and with no scope; with none
 *          bound a platform row runs as it is and an owned row is refused (`RowIsolationMissingError`, or the caller's
 *          own refusal) before any work.
 * Boundary: test only; a recording isolation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495; ADR 0239 (2026-11-07 amendment, gap A).
 */
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import type { CallIsolation } from "#contracts/ports/call-isolation.port";
import { RowIsolationMissingError } from "#core/errors/row-isolation-missing.error";
import { inRowOwner } from "#core/functions/in-row-owner.function";

describe("inRowOwner", () => {
  it("runs the work through the isolation as the system actor in the row's owner", async () => {
    const runs: unknown[][] = [];
    const isolation = {
      run: (actor: Actor, scope: unknown, work: () => Promise<unknown>, options: unknown) => {
        runs.push([actor, scope, options]);
        return work();
      },
    } as unknown as CallIsolation;
    await expect(
      inRowOwner(isolation, "sys_outbox_relay", "scp_acme", "evt_A", async () => 1),
    ).resolves.toBe(1);
    await expect(
      inRowOwner(isolation, "sys_outbox_relay", undefined, "evt_B", async () => 2),
    ).resolves.toBe(2);
    expect(runs).toEqual([
      [
        { kind: ActorKind.System, id: "sys_outbox_relay", scopeId: "scp_acme" },
        undefined,
        { readOnly: false },
      ],
      [{ kind: ActorKind.System, id: "sys_outbox_relay" }, undefined, { readOnly: false }],
    ]);
  });

  it("runs a platform row as it is with no isolation, and refuses an owned one before any work", async () => {
    await expect(
      inRowOwner(undefined, "sys_outbox_relay", undefined, "evt_A", async () => 3),
    ).resolves.toBe(3);
    let ran = false;
    const refused = inRowOwner(undefined, "sys_outbox_relay", "scp_acme", "evt_B", async () => {
      ran = true;
    });
    await expect(refused).rejects.toBeInstanceOf(RowIsolationMissingError);
    await expect(refused).rejects.toMatchObject({ details: { id: "evt_B" } });
    expect(ran).toBe(false);
  });

  it("refuses an owned row with the caller's own refusal when it passes one", async () => {
    class OwnRowIsolationMissingError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {
      id!: string;
    }
    const refused = inRowOwner(
      undefined,
      "sys_queue_worker",
      "scp_acme",
      "job_B",
      async () => undefined,
      (details) => OwnRowIsolationMissingError.create(details),
    );
    await expect(refused).rejects.toBeInstanceOf(OwnRowIsolationMissingError);
    await expect(refused).rejects.toMatchObject({ details: { id: "job_B" } });
  });
});

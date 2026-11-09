/**
 * Stackra file contract:
 * Purpose: unit tests of `inRowOwner`: with an isolation bound the work runs through it as the worker's system actor
 *          in the job's owner (or as the platform for a job with none), never read-only and with no scope; with none
 *          bound a platform job runs as it is and an owned job is refused (`JobRowIsolationMissingError`) before any
 *          work.
 * Boundary: test only; a recording isolation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495; ADR 0239 (2026-11-07 amendment, gap A).
 */
import type { CallIsolation } from "@stackra/actions/contracts";
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { JobRowIsolationMissingError } from "#core/errors/job-row-isolation-missing.error";
import { inRowOwner } from "#core/functions/in-row-owner.function";

describe("inRowOwner", () => {
  it("runs the work through the isolation as the worker's system actor in the job's owner", async () => {
    const runs: unknown[][] = [];
    const isolation = {
      run: (actor: Actor, scope: unknown, work: () => Promise<unknown>, options: unknown) => {
        runs.push([actor, scope, options]);
        return work();
      },
    } as unknown as CallIsolation;
    await expect(inRowOwner(isolation, "scp_acme", "job_A", async () => 1)).resolves.toBe(1);
    await expect(inRowOwner(isolation, undefined, "job_B", async () => 2)).resolves.toBe(2);
    expect(runs).toEqual([
      [
        { kind: ActorKind.System, id: "sys_queue_worker", scopeId: "scp_acme" },
        undefined,
        { readOnly: false },
      ],
      [{ kind: ActorKind.System, id: "sys_queue_worker" }, undefined, { readOnly: false }],
    ]);
  });

  it("runs a platform job as it is with no isolation, and refuses an owned one before any work", async () => {
    await expect(inRowOwner(undefined, undefined, "job_A", async () => 3)).resolves.toBe(3);
    let ran = false;
    const refused = inRowOwner(undefined, "scp_acme", "job_B", async () => {
      ran = true;
    });
    await expect(refused).rejects.toBeInstanceOf(JobRowIsolationMissingError);
    await expect(refused).rejects.toMatchObject({ details: { id: "job_B" } });
    expect(ran).toBe(false);
  });
});

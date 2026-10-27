/**
 * Stackra file contract:
 * Purpose: unit tests of `EraseSubjectAction`: a system-only job, unique, an hour at most, retried three times, that
 *          starts `EraseSubjectWorkflow` with its input and answers with the run's receipt.
 * Boundary: test only; a hand-built action context whose `run` records every call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0189 (decision 2); ADR 0305 (rule 28); STA-1375.
 */
import type { ActionContext } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { EraseSubjectAction } from "#node/actions/erase-subject.action";
import { EraseSubjectInput } from "#node/schemas/erase-subject-input.schema";
import { EraseSubjectWorkflow } from "#node/workflows/erase-subject.workflow";

describe("EraseSubjectAction", () => {
  it("is a system-only job", () => {
    const options = kindOf(EraseSubjectAction)?.options;
    expect(options?.["key"]).toBe("subject.erase");
    expect(options?.["actors"]).toEqual([ActorKind.System]);
    expect(options?.["job"]).toEqual({ unique: true, timeout: "1h", retries: 3 });
  });

  it("starts the erasure saga with its input", async () => {
    const calls: unknown[][] = [];
    const ctx = {
      run: async (...args: unknown[]) => {
        calls.push(args);
        return { shredded: true };
      },
    } as unknown as ActionContext;
    const input = EraseSubjectInput.create({ erasureId: "era_1", subject: "usr_1" });

    await expect(new EraseSubjectAction().handle(input, ctx)).resolves.toEqual({ shredded: true });
    expect(calls).toEqual([[EraseSubjectWorkflow, input]]);
  });
});

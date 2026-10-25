/**
 * Stackra file contract:
 * Purpose: unit tests of the `WorkflowJournal` port: it is a `Port` and its own token, and its key narrows
 *          `DriverName<WorkflowJournal>` to the shipped journals.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (drivers behind ports); ADR 0294 (decision 4).
 */
import "#core/types/workflow-journal-names.type";

import type { DriverName, DriverRegistry } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MemoryWorkflowJournalDriver } from "#core/drivers/memory-workflow-journal.driver";
import { WorkflowJournal } from "#core/ports/workflow-journal.port";

describe("WorkflowJournal", () => {
  it("is a port its drivers extend", () => {
    expect(WorkflowJournal.prototype).toBeInstanceOf(Port);
    expect(new MemoryWorkflowJournalDriver()).toBeInstanceOf(WorkflowJournal);
  });

  it("narrows its driver names to the shipped journals", () => {
    expectTypeOf<WorkflowJournal["~key"]>().toEqualTypeOf<"workflow.WorkflowJournal">();
    expectTypeOf<DriverName<WorkflowJournal>>().toEqualTypeOf<"postgres" | "memory">();
    expectTypeOf<DriverRegistry["workflow.WorkflowJournal"]>().toEqualTypeOf<
      DriverName<WorkflowJournal>
    >();
  });
});

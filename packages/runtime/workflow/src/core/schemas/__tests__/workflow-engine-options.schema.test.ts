/**
 * Stackra file contract:
 * Purpose: unit tests of `WorkflowEngineOptions`: a shape registered with the shipped `WorkflowConfig$`, whose
 *          initializer equals the shipped default (`postgres`), with `journal` typed as the journal driver names; the
 *          schema refuses a journal nobody ships.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4 and 19).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { WORKFLOW_CONFIG_SCHEMA } from "#core/constants/workflow-config-schema.constant";
import { WORKFLOW_JOURNALS } from "#core/constants/workflow-journals.constant";
import { WorkflowEngineOptions } from "#core/schemas/workflow-engine-options.schema";

describe("WorkflowEngineOptions", () => {
  it("is a shape registered with the shipped schema", () => {
    expect(new WorkflowEngineOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(WorkflowEngineOptions)).toBe(WORKFLOW_CONFIG_SCHEMA);
  });

  it("has an initializer equal to the shipped default", () => {
    expect({ ...new WorkflowEngineOptions() }).toEqual(WORKFLOW_CONFIG_SCHEMA.parse({}));
    expect(WORKFLOW_CONFIG_SCHEMA.parse({})).toEqual({ journal: "postgres" });
  });

  it("accepts the shipped journals only", () => {
    expect(WORKFLOW_JOURNALS).toEqual(["postgres", "memory"]);
    expect(WORKFLOW_CONFIG_SCHEMA.parse({ journal: "memory" }).journal).toBe("memory");
    expect(WORKFLOW_CONFIG_SCHEMA.safeParse({ journal: "temporal" }).success).toBe(false);
  });

  it("types journal as the WorkflowJournal driver names", () => {
    expectTypeOf<WorkflowEngineOptions["journal"]>().toEqualTypeOf<"postgres" | "memory">();
  });
});

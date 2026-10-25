/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the Postgres journal and the explorer are its values, and
 *          nothing else is (the migration is found by its path).
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/workflow/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual(["PostgresWorkflowJournalDriver", "WorkflowExplorer"]);
  });
});

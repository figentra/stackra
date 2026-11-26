/**
 * Stackra file contract:
 * Purpose: the `workflow-journal-row-owners` codemod fixture (0.29.0): a custom WorkflowJournal without
 *          `currentOwner` is reported, one that has it is not, and a file that does not import from
 *          `@stackra/workflow` is not read.
 * Boundary: test fixture only; the sources are strings, never compiled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0199 (Enforcement); STA-145; changeset 9eb3427.
 */
import type { CodemodFixture } from "#node/upgrade/constants/__tests__/fixtures/codemod-fixture.type";

const legacy = `import { WorkflowJournal } from "@stackra/workflow";

export class DynamoWorkflowJournal extends WorkflowJournal {
  async due() {}
  async expire() {}
}
`;

const ported = `import { WorkflowJournal } from "@stackra/workflow";

export class DynamoWorkflowJournal extends WorkflowJournal {
  currentOwner() {}
  async due() {}
  async expired() {}
}
`;

const unrelated = `import { WorkflowJournal } from "./journal";

export class LocalJournal extends WorkflowJournal {}
`;

export const WORKFLOW_JOURNAL_ROW_OWNERS_FIXTURE: CodemodFixture = {
  files: [
    {
      path: "services/flows/src/dynamo-journal.driver.ts",
      before: legacy,
      after: legacy,
      findings: ["3:8"],
    },
    { path: "services/ops/src/dynamo-journal.driver.ts", before: ported, after: ported },
    { path: "services/ops/src/local.ts", before: unrelated, after: unrelated },
  ],
};

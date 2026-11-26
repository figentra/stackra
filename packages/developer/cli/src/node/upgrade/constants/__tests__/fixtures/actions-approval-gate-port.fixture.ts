/**
 * Stackra file contract:
 * Purpose: the `actions-approval-gate-port` codemod fixture (0.4.0): a driver still on `check` is reported, a driver
 *          already on `decide` is not, and a class in a file that does not import from `@stackra/actions` is not read.
 * Boundary: test fixture only; the sources are strings, never compiled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0199 (Enforcement); ADR 0509; STA-145; changeset 7a94bc4.
 */
import type { CodemodFixture } from "#node/upgrade/constants/__tests__/fixtures/codemod-fixture.type";

const legacy = `import { ApprovalGate } from "@stackra/actions/contracts";

export class TasksApprovalGateDriver extends ApprovalGate {
  async check() {
    return { approved: false };
  }
}
`;

const ported = `import { ApprovalGate } from "@stackra/actions/contracts";

export class RecordsApprovalGateDriver extends ApprovalGate {
  async decide() {}
  async park() {}
  async find() {}
  async begin() {}
  async settle() {}
}
`;

const unrelated = `import { ApprovalGate } from "./local-gate";

export class LocalGate extends ApprovalGate {}
`;

export const ACTIONS_APPROVAL_GATE_PORT_FIXTURE: CodemodFixture = {
  files: [
    {
      path: "services/tasks/src/tasks-approval-gate.driver.ts",
      before: legacy,
      after: legacy,
      findings: ["3:8"],
    },
    { path: "services/records/src/records-approval-gate.driver.ts", before: ported, after: ported },
    { path: "services/records/src/local.ts", before: unrelated, after: unrelated },
  ],
};

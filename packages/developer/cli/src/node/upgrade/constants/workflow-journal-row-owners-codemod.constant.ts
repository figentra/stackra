/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_JOURNAL_ROW_OWNERS_CODEMOD`, 0.29.0: the workflow journal becomes tenant-owned; the codemod
 *          reports each custom `WorkflowJournal`.
 * Boundary: data only; the rule is `portWithout`'s (a class extending the port without the named method).
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 9eb3427.
 */
import { portWithout } from "#node/upgrade/functions/port-without.function";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** The workflow journal is tenant-owned and WorkflowJournal gains currentOwner. */
export const WORKFLOW_JOURNAL_ROW_OWNERS_CODEMOD: UpgradeCodemod = {
  id: "workflow-journal-row-owners",
  version: "0.29.0",
  title: "The workflow journal is tenant-owned and WorkflowJournal gains currentOwner",
  note: "Finish or cancel the workflows running below a tenant node before you migrate workflow.0012: it refuses, changing nothing, while a run or a held signal sits below a tenant node. A run that waits for acks must start in the tenant the acks are sent in. A custom WorkflowJournal driver ports: due returns RunClaim, expire is replaced by expired(now, limit) and remove(ids), and currentOwner() is new. The codemod lists each custom journal.",
  source: "9eb3427",
  report: {
    modules: ["@stackra/workflow", "@stackra/workflow/contracts"],
    rule: portWithout("WorkflowJournal", "currentOwner"),
    message:
      "port this WorkflowJournal: due returns RunClaim, expired(now, limit) and remove(ids) replace expire, and currentOwner() is new",
  },
};

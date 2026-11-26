/**
 * Stackra file contract:
 * Purpose: `ACTIONS_APPROVAL_GATE_PORT_CODEMOD`, 0.4.0: `ApprovalGate.check` is removed and the port is `decide`,
 *          `park`, `find`, `begin` and `settle`; the codemod reports every class that extends or implements
 *          `ApprovalGate` without `decide`, since only its author can port it.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0509; STA-145; changeset 7a94bc4 (STA-1724).
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** The declarative approval stage. */
export const ACTIONS_APPROVAL_GATE_PORT_CODEMOD: UpgradeCodemod = {
  id: "actions-approval-gate-port",
  version: "0.4.0",
  title: "ApprovalGate.check is removed: the gate is decide, park, find, begin and settle",
  note: "A custom ApprovalGate driver must implement decide, park, find, begin and settle (ADR 0509), and a park from tenant approval rules alone now needs an ApprovalBindingStore bound (the Postgres driver is in @stackra/tenancy/node). The codemod lists each driver to port; nothing is rewritten.",
  source: "7a94bc4, STA-1724",
  report: {
    modules: ["@stackra/actions", "@stackra/actions/contracts"],
    rule: {
      any: [
        { kind: "class_declaration" },
        { kind: "abstract_class_declaration" },
        { kind: "class" },
      ],
      has: {
        kind: "class_heritage",
        has: {
          any: [{ kind: "identifier" }, { kind: "type_identifier" }],
          regex: "^ApprovalGate$",
          stopBy: "end",
        },
      },
      not: {
        has: {
          field: "body",
          has: { kind: "method_definition", has: { field: "name", regex: "^decide$" } },
        },
      },
    },
    message:
      "port this ApprovalGate driver to decide, park, find, begin and settle (check is removed), and bind an ApprovalBindingStore",
  },
};

/**
 * Stackra file contract:
 * Purpose: unit tests of `memberContracts` on a real git workspace: a member that had a manifest at the base commit is
 *          projected at that commit and in the working tree; a new member has no baseline and is left out; a removed
 *          member projects to no path; a manifest outside the workspace globs never counts; an unreadable manifest is
 *          a problem line; an unknown base is an error.
 * Boundary: test only; writes a throwaway git repository under the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); ADR 0158; STA-2837.
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import {
  contractManifest,
  contractWorkspace,
  type ContractWorkspace,
} from "#node/contract/__tests__/fixtures/contract-workspace.fixture";
import { memberContracts } from "#node/contract/functions/member-contracts.function";

const MANIFEST = "stackra.manifest.json";
const voidInvoice = {
  key: "billing.invoice.void",
  method: "POST",
  path: "/app/invoices/:invoiceId/void",
};
const listInvoices = { key: "billing.invoice.list", method: "GET", path: "/app/invoices" };

/** The ledger's shapes, its void input requiring `required`. */
const ledgerShapes = (required: readonly string[]) => ({
  "ledger.VoidInput": {
    type: "object",
    properties: { invoiceId: { type: "string" }, reason: { $ref: "#/schemas/ledger.Reason" } },
    required,
  },
  "ledger.Reason": { type: "string" },
});

let workspace: ContractWorkspace;

beforeEach(() => {
  workspace = contractWorkspace();
});

afterEach(() => {
  workspace.dispose();
});

describe("memberContracts", () => {
  it("projects each member that had a contract at the base commit, at that commit and now", () => {
    workspace.write(`services/billing/${MANIFEST}`, contractManifest("billing", [voidInvoice]));
    workspace.write(`services/orders/${MANIFEST}`, contractManifest("orders", [listInvoices]));
    workspace.write(`fixtures/legacy/${MANIFEST}`, contractManifest("legacy", [voidInvoice]));
    const base = workspace.commit("base");
    workspace.write(
      `services/billing/${MANIFEST}`,
      contractManifest("billing", [voidInvoice, listInvoices]),
    );
    workspace.remove(`services/orders/${MANIFEST}`);
    workspace.write(`services/fresh/${MANIFEST}`, contractManifest("fresh", [voidInvoice]));

    const { contracts, problems } = memberContracts(workspace.root, base);
    expect(problems).toEqual([]);
    expect(contracts.map((contract) => contract.dir)).toEqual([
      "services/billing",
      "services/orders",
    ]);
    const [billing, orders] = contracts;
    expect(Object.keys(billing?.base.paths ?? {})).toEqual(["/app/invoices/{invoiceId}/void"]);
    expect(Object.keys(billing?.next.paths ?? {}).sort()).toEqual([
      "/app/invoices",
      "/app/invoices/{invoiceId}/void",
    ]);
    expect(Object.keys(orders?.base.paths ?? {})).toEqual(["/app/invoices"]);
    expect(orders?.next.paths).toEqual({});
    expect(orders?.next.info).toEqual(orders?.base.info);
  });

  it("reports a manifest it cannot read as a problem, on either side", () => {
    workspace.write(`services/billing/${MANIFEST}`, "{ not json");
    workspace.write(`services/orders/${MANIFEST}`, contractManifest("orders", [listInvoices]));
    const base = workspace.commit("base");
    workspace.write(`services/orders/${MANIFEST}`, "[");

    const { contracts, problems } = memberContracts(workspace.root, base);
    expect(contracts).toEqual([]);
    expect(problems.map((problem) => problem.dir)).toEqual([
      "services/billing",
      "services/billing",
      "services/orders",
    ]);
    expect(problems[0]?.text).toMatch(/^cannot project stackra\.manifest\.json at [0-9a-f]{40}: /);
    expect(problems[1]?.text).toMatch(
      /^cannot project stackra\.manifest\.json in the working tree: /,
    );
    expect(problems[2]?.text).toMatch(
      /^cannot project stackra\.manifest\.json in the working tree: /,
    );
  });

  it("brings a mounted package's shape in from that package's manifest on each side", () => {
    const mounted = {
      key: "billing.invoice.void",
      method: "POST",
      path: "/app/invoices/:invoiceId/void",
      input: { $ref: "@acme/service-ledger#/schemas/ledger.VoidInput" },
    };
    workspace.write(`services/billing/${MANIFEST}`, contractManifest("billing", [mounted]));
    workspace.write(
      `services/ledger/${MANIFEST}`,
      contractManifest("ledger", [], ledgerShapes(["invoiceId"])),
    );
    const base = workspace.commit("base");
    workspace.write(
      `services/ledger/${MANIFEST}`,
      contractManifest("ledger", [], ledgerShapes(["invoiceId", "reason"])),
    );

    const { contracts } = memberContracts(workspace.root, base);
    const billing = contracts.find((contract) => contract.dir === "services/billing");
    const key = "_acme_service-ledger.ledger.VoidInput";
    expect(billing?.base.paths["/app/invoices/{invoiceId}/void"]?.["post"]).toMatchObject({
      requestBody: {
        content: { "application/json": { schema: { $ref: `#/components/schemas/${key}` } } },
      },
    });
    expect(billing?.base.components.schemas[key]).toMatchObject({
      required: ["invoiceId"],
      properties: { reason: { $ref: "#/components/schemas/_acme_service-ledger.ledger.Reason" } },
    });
    expect(billing?.next.components.schemas[key]).toMatchObject({
      required: ["invoiceId", "reason"],
    });
    expect(billing?.next.components.schemas["_acme_service-ledger.ledger.Reason"]).toEqual({
      type: "string",
    });
  });

  it("fails on a base commit git does not know", () => {
    workspace.commit("base");
    expect(() => memberContracts(workspace.root, "no-such-ref")).toThrow();
  });
});

/**
 * Stackra file contract:
 * Purpose: the contract tier of the `oasdiff` check, on the real binary (ADR 0182 decision 4): the OpenAPI projection
 *          of a manifest that drops an operation, or makes a new input field required, is an error-level break; one
 *          that only adds an operation or an optional field is not; and `contractFindings` on a git workspace fails
 *          the member that made the break, naming the operation and the rule.
 * Boundary: test only; needs `oasdiff` on PATH (mise.toml pins it); writes throwaway files under the OS temp
 *           directory.
 * Runtime: node (vitest, contract tier)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decisions 1 and 4); ADR 0158; STA-2837.
 */
import { openApiOf } from "@stackra/gen";
import { describe, expect, it } from "@stackra/testing";

import {
  contractManifest,
  contractWorkspace,
} from "#node/contract/__tests__/fixtures/contract-workspace.fixture";
import { contractFindings } from "#node/contract/functions/contract-findings.function";
import { oasdiffBreaks } from "#node/contract/functions/oasdiff-breaks.function";

const voidInvoice = {
  key: "billing.invoice.void",
  method: "POST",
  path: "/app/invoices/:invoiceId/void",
  fields: ["invoiceId", "reason"],
};
const listInvoices = { key: "billing.invoice.list", method: "GET", path: "/app/invoices" };

/** The ledger's shapes, its void input requiring `required`. */
const ledgerShapes = (required: readonly string[]) => ({
  "ledger.VoidInput": {
    type: "object",
    properties: { invoiceId: { type: "string" }, reason: { type: "string" } },
    required,
  },
});

/** The error-level rule ids from one manifest's actions to the next's. */
const errors = async (
  before: Parameters<typeof contractManifest>[1],
  after: Parameters<typeof contractManifest>[1],
): Promise<string[]> =>
  (
    await oasdiffBreaks(
      openApiOf(contractManifest("billing", before)),
      openApiOf(contractManifest("billing", after)),
    )
  )
    .filter((change) => change.level >= 3)
    .map((change) => `${change.operation} ${change.path} ${change.id}`);

describe("oasdiff on the manifest projection", () => {
  it("finds a removed operation", async () => {
    expect(await errors([voidInvoice, listInvoices], [listInvoices])).toEqual([
      "POST /app/invoices/{invoiceId}/void api-path-removed-without-deprecation",
    ]);
  });

  it("finds a new required input field", async () => {
    expect(
      await errors(
        [voidInvoice],
        [
          {
            ...voidInvoice,
            fields: [...voidInvoice.fields, "approvedBy"],
            required: ["approvedBy"],
          },
        ],
      ),
    ).toEqual(["POST /app/invoices/{invoiceId}/void new-required-request-property"]);
  });

  it("lets an added operation and an optional field through", async () => {
    expect(
      await errors(
        [voidInvoice],
        [{ ...voidInvoice, fields: [...voidInvoice.fields, "note"] }, listInvoices],
      ),
    ).toEqual([]);
  });

  it("fails a host when a package it mounts makes an input field required", async () => {
    const workspace = contractWorkspace();
    try {
      workspace.write(
        "services/billing/stackra.manifest.json",
        contractManifest("billing", [
          { ...voidInvoice, input: { $ref: "@acme/service-ledger#/schemas/ledger.VoidInput" } },
        ]),
      );
      workspace.write(
        "services/ledger/stackra.manifest.json",
        contractManifest("ledger", [], ledgerShapes(["invoiceId"])),
      );
      const base = workspace.commit("base");
      workspace.write(
        "services/ledger/stackra.manifest.json",
        contractManifest("ledger", [], ledgerShapes(["invoiceId", "reason"])),
      );
      expect(await contractFindings(workspace.root, base, { today: "2026-11-26" })).toEqual([
        {
          dir: "services/billing",
          text: expect.stringMatching(
            /^POST \/app\/invoices\/\{invoiceId\}\/void: .*reason.* \[request-property-became-required\]$/,
          ),
        },
      ]);
    } finally {
      workspace.dispose();
    }
  });

  it("fails the member that broke its contract since the base commit", async () => {
    const workspace = contractWorkspace();
    try {
      workspace.write(
        "services/billing/stackra.manifest.json",
        contractManifest("billing", [voidInvoice, listInvoices]),
      );
      workspace.write("services/orders/stackra.manifest.json", contractManifest("orders", []));
      const base = workspace.commit("base");
      workspace.write(
        "services/billing/stackra.manifest.json",
        contractManifest("billing", [listInvoices]),
      );
      workspace.write(
        "services/orders/stackra.manifest.json",
        contractManifest("orders", [listInvoices]),
      );
      expect(await contractFindings(workspace.root, base, { today: "2026-11-26" })).toEqual([
        {
          dir: "services/billing",
          text: "POST /app/invoices/{invoiceId}/void: API path removed without deprecation [api-path-removed-without-deprecation]",
        },
      ]);
    } finally {
      workspace.dispose();
    }
  });
});

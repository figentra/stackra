/**
 * Stackra file contract:
 * Purpose: unit tests of `contractFindings` on a real git workspace, with `oasdiffBreaks` replaced: an unchanged member
 *          starts no oasdiff; an error-level break is a finding named by the member folder, a warning is not; an
 *          unexpired accepted break excuses its own member, operation and rule only; an expired one excuses nothing
 *          and says so; a malformed accepted-breaks entry and an unreadable manifest are findings too.
 * Boundary: test only; writes a throwaway git repository under the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); STA-2837.
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import {
  contractManifest,
  contractWorkspace,
  type ContractWorkspace,
} from "#node/contract/__tests__/fixtures/contract-workspace.fixture";
import { contractFindings } from "#node/contract/functions/contract-findings.function";
import { oasdiffBreaks } from "#node/contract/functions/oasdiff-breaks.function";

vi.mock("#node/contract/functions/oasdiff-breaks.function", () => ({ oasdiffBreaks: vi.fn() }));

const MANIFEST = "stackra.manifest.json";
const voidInvoice = { key: "billing.invoice.void", method: "POST", path: "/app/invoices/:id/void" };
const listInvoices = { key: "billing.invoice.list", method: "GET", path: "/app/invoices" };
const removed = {
  id: "api-path-removed-without-deprecation",
  level: 3,
  operation: "POST",
  path: "/app/invoices/{id}/void",
  text: "API path removed without deprecation",
};
const warning = {
  id: "response-optional-property-removed",
  level: 2,
  operation: "GET",
  path: "/app/invoices",
  text: "the response optional property 'total' was removed",
};
const accepted = (overrides: Record<string, string> = {}): string => {
  const entry = {
    member: "services/billing",
    operation: "POST /app/invoices/{id}/void",
    id: "api-path-removed-without-deprecation",
    issue: "STA-2837",
    reason: "the console is the only caller and moves in the same change",
    added: "2026-11-20",
    expires: "2026-12-01",
    ...overrides,
  };
  return `accepted:\n  - ${Object.entries(entry)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n    ")}\n`;
};

let workspace: ContractWorkspace;
let base: string;

beforeEach(() => {
  vi.mocked(oasdiffBreaks).mockReset();
  workspace = contractWorkspace();
  workspace.write(
    `services/billing/${MANIFEST}`,
    contractManifest("billing", [voidInvoice, listInvoices]),
  );
  workspace.write(`services/orders/${MANIFEST}`, contractManifest("orders", [listInvoices]));
  base = workspace.commit("base");
  workspace.write(`services/billing/${MANIFEST}`, contractManifest("billing", [listInvoices]));
});

afterEach(() => {
  workspace.dispose();
});

describe("contractFindings", () => {
  it("fails on an error-level break of a changed member and starts no oasdiff for an unchanged one", async () => {
    vi.mocked(oasdiffBreaks).mockResolvedValue([removed, warning]);
    const findings = await contractFindings(workspace.root, base, {
      today: "2026-11-26",
      oasdiff: "/opt/oasdiff",
    });
    expect(findings).toEqual([
      {
        dir: "services/billing",
        text: "POST /app/invoices/{id}/void: API path removed without deprecation [api-path-removed-without-deprecation]",
      },
    ]);
    expect(oasdiffBreaks).toHaveBeenCalledTimes(1);
    const [before, after, binary] = vi.mocked(oasdiffBreaks).mock.calls[0] ?? [];
    expect(before?.info.title).toBe("@acme/service-billing");
    expect(Object.keys(before?.paths ?? {}).sort()).toEqual([
      "/app/invoices",
      "/app/invoices/{id}/void",
    ]);
    expect(Object.keys(after?.paths ?? {})).toEqual(["/app/invoices"]);
    expect(binary).toBe("/opt/oasdiff");
  });

  it("lets an unexpired accepted break excuse its own member, operation and rule only", async () => {
    vi.mocked(oasdiffBreaks).mockResolvedValue([removed]);
    workspace.write("tools/contract/accepted-breaks.yaml", accepted());
    expect(await contractFindings(workspace.root, base, { today: "2026-11-26" })).toEqual([]);

    for (const other of [
      { member: "services/orders" },
      { operation: "PUT /app/invoices/{id}/void" },
      { id: "request-body-became-required" },
    ]) {
      workspace.write("tools/contract/accepted-breaks.yaml", accepted(other));
      expect(await contractFindings(workspace.root, base, { today: "2026-11-26" })).toHaveLength(1);
    }
  });

  it("excuses nothing with an expired accepted break and says when it expired", async () => {
    vi.mocked(oasdiffBreaks).mockResolvedValue([removed]);
    workspace.write("tools/contract/accepted-breaks.yaml", accepted());
    expect(await contractFindings(workspace.root, base, { today: "2026-12-02" })).toEqual([
      {
        dir: "services/billing",
        text: "POST /app/invoices/{id}/void: API path removed without deprecation [api-path-removed-without-deprecation] (its accepted break expired on 2026-12-01)",
      },
    ]);
  });

  it("reports a malformed accepted break and an unreadable manifest", async () => {
    vi.mocked(oasdiffBreaks).mockResolvedValue([]);
    workspace.write("tools/contract/accepted-breaks.yaml", accepted({ issue: "later" }));
    workspace.write(`services/orders/${MANIFEST}`, "{");
    const findings = await contractFindings(workspace.root, base, { today: "2026-11-26" });
    expect(findings).toEqual([
      {
        dir: "tools/contract/accepted-breaks.yaml",
        text: "accepted[0]: issue must be an issue key (STA-n)",
      },
      {
        dir: "services/orders",
        text: expect.stringMatching(
          /^cannot project stackra\.manifest\.json in the working tree: /,
        ),
      },
    ]);
  });
});

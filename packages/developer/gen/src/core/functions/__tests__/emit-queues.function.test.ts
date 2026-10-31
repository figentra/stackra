/**
 * Stackra file contract:
 * Purpose: unit tests of `emitQueues` and `jobQueues`: a service with a job action gets `Queues` over its job queues and
 *          `default`, built with `queues()` of `@stackra/queue`; a named queue is listed once beside `default`; no file
 *          for a package, an app or a service without jobs.
 * Boundary: test only; runs on the IR fixtures and the manifests built from them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0148 (decisions 1 and 3); STA-1723.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitQueues } from "#core/functions/emit-queues.function";
import { jobQueues } from "#core/functions/job-queues.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** The billing manifest with one more job action on the `ledger_close` queue. */
function withLedgerJob(): StackraManifest {
  const manifest = buildManifest(BILLING_IR).manifest;
  return {
    ...manifest,
    actions: [
      ...(manifest.actions ?? []),
      { key: "billing.ledger.close@1", kind: "action", job: { queue: "ledger_close" } },
    ],
  } as StackraManifest;
}

describe("emitQueues", () => {
  it("lists a service's job queues and default through queues()", () => {
    const content = emitQueues(BILLING_IR, buildManifest(BILLING_IR).manifest) ?? "";
    expect(content).toContain('import { queues } from "@stackra/queue";');
    expect(content).toContain('export const Queues = queues(["default"] as const);');
  });

  it("lists a named queue once beside default, sorted", () => {
    expect(jobQueues(withLedgerJob())).toEqual(["default", "ledger_close"]);
    expect(emitQueues(BILLING_IR, withLedgerJob())).toContain(
      'export const Queues = queues(["default", "ledger_close"] as const);',
    );
  });

  it("writes nothing for a package, an app or a service without jobs", () => {
    expect(emitQueues(LOYALTY_KIT_IR, buildManifest(LOYALTY_KIT_IR).manifest)).toBeUndefined();
    expect(emitQueues(WEB_APP_IR, buildManifest(WEB_APP_IR).manifest)).toBeUndefined();
    const quiet = {
      ...BILLING_IR,
      classes: BILLING_IR.classes.filter((item) => item.kind !== "action"),
    };
    expect(emitQueues(quiet, buildManifest(quiet).manifest)).toBeUndefined();
  });
});

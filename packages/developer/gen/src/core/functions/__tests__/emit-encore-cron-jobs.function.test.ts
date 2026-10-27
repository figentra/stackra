/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreCronJobs`: a service with a cron action gets one CronJob firing its locked key on
 *          its schedule and the stored schedules' minute tick, each with an internal endpoint run through the server
 *          app's handlers; no file for a package, an app or a service that schedules nothing.
 * Boundary: test only; runs on the IR fixtures and the manifests built from them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0148 (decisions 4 and 6); ADR 0266 (decision 4.6).
 */
import { describe, expect, it } from "@stackra/testing";

import { ENCORE_APP_IMPORT } from "#core/constants/encore-app-import.constant";
import { buildManifest } from "#core/functions/build-manifest.function";
import { emitEncoreCronJobs } from "#core/functions/emit-encore-cron-jobs.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("emitEncoreCronJobs", () => {
  it("emits a CronJob per cron action and the stored schedules' tick", () => {
    const file = emitEncoreCronJobs(BILLING_IR, buildManifest(BILLING_IR).manifest);
    expect(file?.path).toBe(".stackra/encore/billing/cron.ts");
    const content = file?.content ?? "";
    expect(content).toContain('import { CronJob } from "encore.dev/cron";');
    expect(content).toContain(ENCORE_APP_IMPORT);
    expect(content).toContain(
      [
        'export const billingInvoiceSendReminders1Job = new CronJob("billing-invoice-send-reminders-1", {',
        '  title: "billing.invoice.send_reminders@1",',
        '  schedule: "0 9 * * *",',
        "  endpoint: billingInvoiceSendReminders1,",
        "});",
      ].join("\n"),
    );
    expect(content).toContain(
      '    await container.get(SchedulerService).fire("billing.invoice.send_reminders@1");',
    );
    expect(content).toContain('new CronJob("scheduler-schedules", {');
    expect(content).toContain(
      "    await container.get(SchedulerService).tick(undefined, { crons: false });",
    );
    expect(content).toContain("api({ expose: false }");
  });

  it("writes nothing for a package, an app or a service that schedules nothing", () => {
    expect(
      emitEncoreCronJobs(LOYALTY_KIT_IR, buildManifest(LOYALTY_KIT_IR).manifest),
    ).toBeUndefined();
    expect(emitEncoreCronJobs(WEB_APP_IR, buildManifest(WEB_APP_IR).manifest)).toBeUndefined();
    // No cron action and no @stackra/scheduler: a service that runs the scheduler still gets the minute tick.
    const quiet = {
      ...BILLING_IR,
      classes: BILLING_IR.classes.filter((item) => item.kind !== "action"),
      packages: (BILLING_IR.packages ?? []).filter((name) => name !== "@stackra/scheduler"),
      dependencies: BILLING_IR.dependencies.filter(
        (dependency) => dependency.package !== "@stackra/scheduler",
      ),
    };
    expect(emitEncoreCronJobs(quiet, buildManifest(quiet).manifest)).toBeUndefined();
  });
});

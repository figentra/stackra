/**
 * Stackra file contract:
 * Purpose: unit tests of `cronJobId`: a locked key becomes lowercase letters, digits and single hyphens, with no hyphen
 *          at either end, as the scheduler's `encoreCronJobs()` names it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0148 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { cronJobId } from "#core/functions/cron-job-id.function";

describe(cronJobId, () => {
  it("maps a locked key to a CronJob id", () => {
    expect(cronJobId("billing.invoice.send_reminders@1")).toBe("billing-invoice-send-reminders-1");
    expect(cronJobId("Orders.Order.Expire__Unpaid@12")).toBe("orders-order-expire-unpaid-12");
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `heartbeatName`: lowercase letters, digits and hyphens, no leading or trailing hyphen, the
 *          kebab-case `@stackra/infra-observability` plans a heartbeat under, and the same as gen's `cronJobId` formula.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0184 (decision 4); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { heartbeatName } from "#core/functions/heartbeat-name.function";

describe(heartbeatName, () => {
  it("writes a job's text as a kebab-case heartbeat name", () => {
    expect(heartbeatName("queue-maintenance")).toBe("queue-maintenance");
    expect(heartbeatName("queue-Exports_EU")).toBe("queue-exports-eu");
    expect(heartbeatName("billing.invoice.send_reminders@1")).toBe(
      "billing-invoice-send-reminders-1",
    );
    expect(heartbeatName("--queue--")).toBe("queue");
  });
});

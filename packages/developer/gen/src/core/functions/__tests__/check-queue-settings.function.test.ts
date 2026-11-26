/**
 * Stackra file contract:
 * Purpose: unit tests of `checkQueueSettings`: a runway `dlq: false` on a queue the service's jobs run on is the
 *          warning `queue_dlq_unsupported`, one per environment; `dlq: true`, an unset `dlq`, a queue no job names and a
 *          member that is not a service are quiet (STA-2050).
 * Boundary: test only; runs on the IR fixtures and the manifests built from them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0148 (decisions 3 and 6); STA-2050.
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { checkQueueSettings } from "#core/functions/check-queue-settings.function";
import { jobQueues } from "#core/functions/job-queues.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

describe(checkQueueSettings, () => {
  const manifest = buildManifest(BILLING_IR).manifest;
  const [queue = "default"] = jobQueues(manifest);

  it("warns once per environment that turns off the dead-letter queue of a job queue", () => {
    const ir = {
      ...BILLING_IR,
      queueSettings: {
        staging: { [queue]: { dlq: false } },
        dev: { [queue]: { visibilityTimeoutSeconds: 30, dlq: false } },
        production: { [queue]: { dlq: true } },
      },
    };
    const warnings = checkQueueSettings(ir, manifest);
    expect(warnings.map(({ code, subject, severity }) => [code, subject, severity])).toEqual([
      ["queue_dlq_unsupported", `dev.${queue}`, "warning"],
      ["queue_dlq_unsupported", `staging.${queue}`, "warning"],
    ]);
    expect(warnings[0]?.file).toBe("runway.yaml");
    expect(warnings[0]?.message).toContain("Encore Pub/Sub subscription");
  });

  it("is quiet for a dead-letter queue left on or unset, a queue no job names and a package", () => {
    expect(
      checkQueueSettings(
        {
          ...BILLING_IR,
          queueSettings: {
            dev: { [queue]: { visibilityTimeoutSeconds: 30 }, unused: { dlq: false } },
            production: { [queue]: { dlq: true } },
          },
        },
        manifest,
      ),
    ).toEqual([]);
    expect(checkQueueSettings(BILLING_IR, manifest)).toEqual([]);
    expect(
      checkQueueSettings(
        { ...LOYALTY_KIT_IR, queueSettings: { dev: { [queue]: { dlq: false } } } },
        manifest,
      ),
    ).toEqual([]);
  });
});

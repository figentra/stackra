/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreQueues`: a service with a job action gets one Pub/Sub topic and subscription per
 *          queue, named after the member, registered as `queue.<name>` and running each delivery through the queue
 *          worker; no file for a package, an app or a service without jobs.
 * Boundary: test only; runs on the IR fixtures and the manifests built from them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0148 (decisions 3 and 6); ADR 0266 (decision 4.3).
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitEncoreQueues } from "#core/functions/emit-encore-queues.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("emitEncoreQueues", () => {
  it("emits a topic and a subscription per queue, registered for the broker publisher", () => {
    const file = emitEncoreQueues(BILLING_IR, buildManifest(BILLING_IR).manifest);
    expect(file?.path).toBe(".stackra/encore/billing/queues.ts");
    const content = file?.content ?? "";
    expect(content).toContain('import { Subscription, Topic } from "encore.dev/pubsub";');
    expect(content).toContain(
      'export const queueDefault = new Topic<BrokerMessage>("billing-queue-default", {',
    );
    expect(content).toContain(
      'export const queueDefaultSubscription = new Subscription(queueDefault, "billing-queue-default", {',
    );
    expect(content).toContain(
      "      await container.get(QueueWorkerService).process(jobOf(message));",
    );
    expect(content).toContain('  { name: "queue.default", topic: queueDefault },');
  });

  it("writes nothing for a package, an app or a service without jobs", () => {
    expect(
      emitEncoreQueues(LOYALTY_KIT_IR, buildManifest(LOYALTY_KIT_IR).manifest),
    ).toBeUndefined();
    expect(emitEncoreQueues(WEB_APP_IR, buildManifest(WEB_APP_IR).manifest)).toBeUndefined();
    const quiet = {
      ...BILLING_IR,
      classes: BILLING_IR.classes.filter((item) => item.kind !== "action"),
    };
    expect(emitEncoreQueues(quiet, buildManifest(quiet).manifest)).toBeUndefined();
  });
});

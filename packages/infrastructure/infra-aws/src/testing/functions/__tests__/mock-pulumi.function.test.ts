/**
 * Stackra file contract:
 * Purpose: unit tests of `mockPulumi`: a resource registers with its inputs and gets a fake ARN; `find` matches the
 *          full type token or its class name and fails for an unknown resource; the stack config reaches
 *          `pulumi.Config` under the project's namespace.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (testing helpers in the owner package).
 */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

describe("mockPulumi", () => {
  it("records each resource with its inputs and a fake ARN", async () => {
    const engine = await mockPulumi();
    const topic = new aws.sns.Topic("alerts", { displayName: "Alerts" });

    const recorded = await engine.find("aws:sns/topic:Topic", "alerts");
    expect(recorded.inputs["displayName"]).toBe("Alerts");
    expect(await engine.find("Topic", "alerts")).toBe(recorded);
    expect(await outputOf(topic.arn)).toBe("arn:aws:mock:::alerts");
    expect(engine.resources).toContain(recorded);
  });

  it("fails to find a resource nobody registered", async () => {
    const engine = await mockPulumi();

    await expect(engine.find("Topic", "missing")).rejects.toThrow(/No Topic named missing/);
  });

  it("installs the stack config under the project's namespace", async () => {
    await mockPulumi({ region: "me-central-1", aws: { accounts: { prod: "123456789012" } } });
    const config = new pulumi.Config();

    expect(config.require("region")).toBe("me-central-1");
    expect(config.requireObject<{ accounts: { prod: string } }>("aws").accounts.prod).toBe(
      "123456789012",
    );
  });
});

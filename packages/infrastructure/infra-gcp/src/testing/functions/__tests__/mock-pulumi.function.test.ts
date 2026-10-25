/**
 * Stackra file contract:
 * Purpose: unit tests of `mockPulumi`: a resource registers with its inputs and gets a fake id, name and email; `find`
 *          matches the full type token or its class name and fails for an unknown resource; the stack config reaches
 *          `pulumi.Config` under the project's namespace.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (testing helpers in the owner package).
 */
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

describe("mockPulumi", () => {
  it("records each resource with its inputs and a fake id, name and email", async () => {
    const engine = await mockPulumi();
    const topic = new gcp.pubsub.Topic("alerts", { project: "acme-stg" });
    const account = new gcp.serviceaccount.Account("deploy", { accountId: "acme-deploy" });

    const recorded = await engine.find("gcp:pubsub/topic:Topic", "alerts");
    expect(recorded.inputs["project"]).toBe("acme-stg");
    expect(await engine.find("Topic", "alerts")).toBe(recorded);
    expect(await outputOf(topic.id)).toBe("alerts-id");
    expect(await outputOf(topic.name)).toBe("alerts");
    expect(await outputOf(account.email)).toBe("deploy@mock.iam.gserviceaccount.com");
    expect(engine.resources).toContain(recorded);
  });

  it("fails to find a resource nobody registered", async () => {
    const engine = await mockPulumi();

    await expect(engine.find("Topic", "missing")).rejects.toThrow(/No Topic named missing/);
  });

  it("installs the stack config under the project's namespace", async () => {
    await mockPulumi({ region: "europe-west3", gcp: { projects: { prod: { id: "acme-prod" } } } });
    const config = new pulumi.Config();

    expect(config.require("region")).toBe("europe-west3");
    expect(
      config.requireObject<{ projects: { prod: { id: string } } }>("gcp").projects.prod.id,
    ).toBe("acme-prod");
  });
});

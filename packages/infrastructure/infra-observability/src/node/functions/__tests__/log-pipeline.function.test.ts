/**
 * Stackra file contract:
 * Purpose: unit tests of `logPipeline`: one OpenTelemetry source with the hot retention, writing to the archive it
 *          keeps after that; no archive when the cold months are 0; the OTLP endpoint and the secret token.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184 (decisions 1, 2 and 5).
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import {
  declaredAs,
  mockPulumi,
  settled,
  valueOf,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";
import { logPipeline } from "#node/functions/log-pipeline.function";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

describe("logPipeline", () => {
  it("sends OTLP to one source that archives after 30 days", async () => {
    const logs = logPipeline({ project: "acme-platform", hotDays: 30, coldMonths: 13 });
    await settled(logs);

    const source = declaredAs(declared, "logtail:index/source:Source")[0]?.inputs;
    expect(source).toMatchObject({
      name: "acme-platform",
      platform: "open_telemetry",
      logsRetention: 30,
      customBucket: {
        endpoint: "https://logs-archive-acme-platform.s3.me-central-1.amazonaws.com",
        accessKeyId: "logs-archive-acme-platform-id",
        keepDataAfterRetention: true,
      },
    });
    expect(declaredAs(declared, "aws:s3/bucket:Bucket")).toHaveLength(1);
    expect(await valueOf(logs.endpoint)).toBe("https://telemetry-acme-platform.ingest.test");
    expect(await valueOf(logs.token)).toBe("telemetry-acme-platform-token");
    expect(await pulumi.isSecret(logs.token)).toBe(true);
  });

  it("keeps no archive when the cold months are 0", async () => {
    const logs = logPipeline({ project: "acme-platform", hotDays: 14, coldMonths: 0 });
    await settled(logs);

    expect(logs.archive).toBeUndefined();
    expect(declared.map((resource) => resource.type)).toEqual(["logtail:index/source:Source"]);
    expect(declaredAs(declared, "logtail:index/source:Source")[0]?.inputs).toEqual({
      name: "acme-platform",
      platform: "open_telemetry",
      logsRetention: 14,
    });
  });
});

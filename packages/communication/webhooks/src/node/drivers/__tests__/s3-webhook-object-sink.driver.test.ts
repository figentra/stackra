/**
 * Stackra file contract:
 * Purpose: unit tests of `S3WebhookObjectSinkDriver`: one `PutObject` with the bucket, the key, the exact body as JSON
 *          and the signed headers as metadata, the job's signal passed on, one client per region, and a store error
 *          rejected as it is.
 * Boundary: test only; `S3Client.prototype.send` is replaced, so no AWS call is made.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0422 (decision 4).
 */
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { WebhookObjectSink } from "#contracts/index";
import { S3WebhookObjectSinkDriver } from "#node/drivers/s3-webhook-object-sink.driver";

const OBJECT = {
  bucket: "acme-siem",
  region: "me-central-1",
  key: "siem/records.audit_record.appended.v1/2026/10/26/evt_1.json",
  body: '{"type":"records.audit_record.appended.v1"}',
  metadata: {
    "webhook-id": "evt_1",
    "webhook-timestamp": "1793000000",
    "webhook-signature": "v1,abc",
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe(S3WebhookObjectSinkDriver, () => {
  it("is a WebhookObjectSink", () => {
    expect(new S3WebhookObjectSinkDriver()).toBeInstanceOf(WebhookObjectSink);
  });

  it("puts one object with the body, the metadata and the job's signal", async () => {
    const calls: { command: unknown; options: unknown; region: unknown }[] = [];
    vi.spyOn(S3Client.prototype, "send").mockImplementation(async function (
      this: S3Client,
      command: unknown,
      options: unknown,
    ) {
      calls.push({ command, options, region: await this.config.region() });
      return {};
    } as never);
    const signal = new AbortController().signal;
    const sink = new S3WebhookObjectSinkDriver();
    await sink.put({ ...OBJECT, signal });
    await sink.put(OBJECT);
    expect(calls).toHaveLength(2);
    const [first] = calls;
    expect(first?.command).toBeInstanceOf(PutObjectCommand);
    expect((first?.command as PutObjectCommand | undefined)?.input).toEqual({
      Bucket: "acme-siem",
      Key: OBJECT.key,
      Body: OBJECT.body,
      ContentType: "application/json",
      Metadata: OBJECT.metadata,
    });
    expect(first?.options).toEqual({ abortSignal: signal });
    expect(first?.region).toBe("me-central-1");
  });

  it("rejects with the store's error", async () => {
    vi.spyOn(S3Client.prototype, "send").mockImplementation((async () => {
      throw Object.assign(new Error("AccessDenied"), { name: "AccessDenied" });
    }) as never);
    await expect(new S3WebhookObjectSinkDriver().put(OBJECT)).rejects.toThrow("AccessDenied");
  });
});

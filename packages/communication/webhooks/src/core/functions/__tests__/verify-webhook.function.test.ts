/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyWebhook`: the Standard Webhooks test vector verifies, under the `webhook-*` and the
 *          Svix `svix-*` names; either secret of a rotation verifies; a changed body, another secret, a stale or future
 *          timestamp, a missing header, a malformed signature and an unknown version do not.
 * Boundary: test only; Web Crypto runs for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0224 (decision 2, enforcement: the Standard Webhooks test vectors); ADR 0308
 *                     (rules 15 and 17).
 */
import { describe, expect, it } from "@stackra/testing";

import { signWebhook } from "#core/functions/sign-webhook.function";
import { verifyWebhook } from "#core/functions/verify-webhook.function";

const SECRET = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw"; // gitleaks:allow -- reason: the published Standard Webhooks test vector, not a secret
const BODY = '{"test": 2432232314}';
const SENT = new Date(1_614_265_330_000);

/** The specification's test vector as received. */
const HEADERS = {
  "webhook-id": "msg_p5jXN8AQM9LWM0D4loKWxJek",
  "webhook-timestamp": "1614265330",
  "webhook-signature": "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
};

/** `seconds` after the vector was sent. */
const after = (seconds: number) => new Date(SENT.getTime() + seconds * 1000);

describe(verifyWebhook, () => {
  it("verifies the test vector", async () => {
    await expect(verifyWebhook(HEADERS, BODY, [SECRET], SENT)).resolves.toBe(true);
  });

  it("reads the Svix header names", async () => {
    const svix = {
      "svix-id": HEADERS["webhook-id"],
      "svix-timestamp": HEADERS["webhook-timestamp"],
      "svix-signature": HEADERS["webhook-signature"],
    };
    await expect(verifyWebhook(svix, BODY, [SECRET], SENT)).resolves.toBe(true);
  });

  it("verifies with either secret of a rotation, and a signature list in any order", async () => {
    const signed = {
      ...(await signWebhook({ id: "msg_1", timestamp: SENT, body: BODY }, ["new-secret", SECRET])),
    };
    await expect(verifyWebhook(signed, BODY, [SECRET], SENT)).resolves.toBe(true);
    await expect(verifyWebhook(signed, BODY, ["new-secret"], SENT)).resolves.toBe(true);
    await expect(verifyWebhook(HEADERS, BODY, ["other-secret", SECRET], SENT)).resolves.toBe(true);
  });

  it("refuses a changed body and another secret", async () => {
    await expect(verifyWebhook(HEADERS, '{"test": 1}', [SECRET], SENT)).resolves.toBe(false);
    await expect(verifyWebhook(HEADERS, BODY, ["test-signing-secret"], SENT)).resolves.toBe(false);
  });

  it("accepts five minutes either way and refuses beyond", async () => {
    await expect(verifyWebhook(HEADERS, BODY, [SECRET], after(300))).resolves.toBe(true);
    await expect(verifyWebhook(HEADERS, BODY, [SECRET], after(-300))).resolves.toBe(true);
    await expect(verifyWebhook(HEADERS, BODY, [SECRET], after(301))).resolves.toBe(false);
    await expect(verifyWebhook(HEADERS, BODY, [SECRET], after(-301))).resolves.toBe(false);
  });

  it("refuses a missing header, a malformed timestamp or signature, and an unknown version", async () => {
    const { "webhook-id": _id, ...noId } = HEADERS;
    await expect(verifyWebhook(noId, BODY, [SECRET], SENT)).resolves.toBe(false);
    await expect(
      verifyWebhook({ ...HEADERS, "webhook-timestamp": "1614265330.5" }, BODY, [SECRET], SENT),
    ).resolves.toBe(false);
    await expect(
      verifyWebhook({ ...HEADERS, "webhook-signature": "v1,not base64!" }, BODY, [SECRET], SENT),
    ).resolves.toBe(false);
    await expect(
      verifyWebhook(
        { ...HEADERS, "webhook-signature": HEADERS["webhook-signature"].replace("v1,", "v2,") },
        BODY,
        [SECRET],
        SENT,
      ),
    ).resolves.toBe(false);
  });

  it("refuses everything when the URL accepts no secret", async () => {
    await expect(verifyWebhook(HEADERS, BODY, [], SENT)).resolves.toBe(false);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `signWebhook`: the Standard Webhooks test vector, one signature per secret during a
 *          rotation, a plain secret read as its UTF-8 bytes, and the refusals of an empty or malformed secret list.
 * Boundary: test only; Web Crypto runs for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0224 (decision 2, enforcement: the Standard Webhooks test vectors); ADR 0308
 *                     (rule 17).
 */
import { describe, expect, it } from "@stackra/testing";

import { signWebhook } from "#core/functions/sign-webhook.function";

/** The test vector of the Standard Webhooks specification's reference libraries. */
const VECTOR = {
  secret: "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw", // gitleaks:allow -- reason: the published Standard Webhooks test vector, not a secret
  id: "msg_p5jXN8AQM9LWM0D4loKWxJek",
  timestamp: new Date(1_614_265_330_000),
  body: '{"test": 2432232314}',
  signature: "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
};

describe(signWebhook, () => {
  it("signs the test vector", async () => {
    const headers = await signWebhook(
      { id: VECTOR.id, timestamp: VECTOR.timestamp, body: VECTOR.body },
      [VECTOR.secret],
    );
    expect(headers).toEqual({
      "webhook-id": VECTOR.id,
      "webhook-timestamp": "1614265330",
      "webhook-signature": VECTOR.signature,
    });
  });

  it("signs once per secret, space-separated, during a rotation", async () => {
    const headers = await signWebhook(
      { id: VECTOR.id, timestamp: VECTOR.timestamp, body: VECTOR.body },
      [VECTOR.secret, "test-signing-secret"],
    );
    expect(headers["webhook-signature"]).toBe(
      `${VECTOR.signature} v1,NYUyp4Sl2e+qI5HyITNuJy5TQwpiDkcT5qKev58XBZs=`,
    );
  });

  it("drops the milliseconds of the timestamp", async () => {
    const headers = await signWebhook(
      { id: "msg_1", timestamp: new Date(1_614_265_330_999), body: "{}" },
      ["test-signing-secret"],
    );
    expect(headers["webhook-timestamp"]).toBe("1614265330");
  });

  it("refuses no secret, an empty secret and a whsec_ secret that is not Base64", async () => {
    const message = { id: "msg_1", timestamp: VECTOR.timestamp, body: "{}" };
    await expect(signWebhook(message, [])).rejects.toThrow(TypeError);
    await expect(signWebhook(message, [""])).rejects.toThrow(TypeError);
    await expect(signWebhook(message, ["whsec_not base64!"])).rejects.toThrow(
      "A webhook secret is a non-empty string, or whsec_ followed by Base64",
    );
  });
});

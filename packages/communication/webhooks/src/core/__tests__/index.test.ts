/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `SignatureScheme` (which the template's Resend integration imports)
 *          is exported with the signer, the verifier, the inbound registration and receiver, the `http` sender and the
 *          delivery refusal, Chatwoot's signature recipe (ADR 0448) and the six regional gateway verifiers (STA-1357),
 *          and nothing else is a value.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as webhooks from "#core/index";

describe("@stackra/webhooks", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(webhooks).sort()).toEqual([
      "CHATWOOT_WEBHOOK_SIGNATURE",
      "HttpWebhookSenderDriver",
      "MemoryWebhookEntitlementSourceDriver",
      "SignatureScheme",
      "WebhookDeliveryFailedError",
      "WebhookReceiver",
      "attemptWebhook",
      "decryptAesGcmBody",
      "registerWebhookEvents",
      "s3TargetOf",
      "signWebhook",
      "verifyBodyToken",
      "verifyHmacWebhook",
      "verifyJwtHs256",
      "verifyKeyedFieldDigest",
      "verifyOrderedFieldHmac",
      "verifySharedHeader",
      "verifyWebhook",
      "webhookBody",
      "webhookObjectKey",
    ]);
  });

  it("takes the template's shape", () => {
    expect(webhooks.SignatureScheme.StandardWebhooks).toBe("standard_webhooks");
  });
});

/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/webhooks (`deliverWebhook`, the `WebhookObjectSinkFake` and the testing-module plugin)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Importing it registers the plugin with the testing module;
 *           `sideEffects` stays `false` because only vitest loads `./testing` and never tree-shakes it. Imports `.`,
 *           `@stackra/container/testing` and the entries of its dependencies; no other package's `./testing` (ADR 0269
 *           decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { WebhookObjectSinkFake } from "#testing/fakes/webhook-object-sink.fake";
export { WEBHOOKS_TESTING_PLUGIN } from "#testing/constants/webhooks-testing-plugin.constant";
export { deliverWebhook } from "#testing/functions/deliver-webhook.function";
export type { WebhookResult } from "#testing/types/webhook-result.type";

/**
 * Stackra file contract:
 * Purpose: `WEBHOOKS_TESTING_PLUGIN`, the testing-module plugin of @stackra/webhooks: on every `compile()` it makes that
 *          app the one `deliverWebhook` delivers to.
 * Boundary: registered when this module loads; each compile replaces the current app. Adds no member to the app and no
 *           builder method: a test sets the secrets and connections through @stackra/config's `.withSecrets` and
 *           @stackra/integrations' `.withConnection`.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the STA-348 registry row (builder extension point).
 */
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingApp, TestingPlugin } from "@stackra/container/testing";

import { CURRENT_APP } from "#testing/constants/current-app.constant";

/**
 * The plugin; registered with the testing module when this module loads.
 *
 * @example
 * await createTestingModule(NotificationsModule).withSecrets({ RESEND_WEBHOOK_SECRET: SECRET }).compile();
 * await deliverWebhook(InboundMailReceived, payload, { secret: SECRET });
 */
export const WEBHOOKS_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/webhooks",
  app(app: TestingApp) {
    CURRENT_APP.value = app;
    return {};
  },
};

registerTestingPlugin(WEBHOOKS_TESTING_PLUGIN);

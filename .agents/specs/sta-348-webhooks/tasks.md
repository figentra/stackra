# Tasks: `@stackra/webhooks` wave 6

**Input**: `.agents/specs/sta-348-webhooks/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-webhooks/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/communication/webhooks` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US3] `WebhookSender` and `WebhookRequest` in `packages/communication/webhooks/src/contracts/` — covers: FR-006, P-006 — route: package — deps: T002
- [x] T004 [US1] `SignatureScheme`, `signWebhook`, `verifyWebhook` and the key and Base64 helpers in `packages/communication/webhooks/src/core/` — covers: FR-002, P-002, FR-003, P-003 — route: package — deps: T002
- [x] T005 [US1] `registerWebhookEvents`, `WebhookReceiver` and their types — covers: FR-004, P-004, FR-005, P-005 — route: package — deps: T004
- [x] T006 [US3] `HttpWebhookSenderDriver` and `WebhookDeliveryFailedError` — covers: FR-006, P-006 — route: package — deps: T003
- [x] T007 [US3] `WebhookEndpoint`, `WebhookDelivery`, their services and migrations in `packages/communication/webhooks/src/node/` — covers: FR-007, P-007, FR-008, P-008 — route: package — deps: T002
- [x] T008 [US3] `DeliverWebhookAction`, `DeliverWebhookInput`, `SendWebhooksListener` and `registerOutboundWebhooks` — covers: FR-006, P-006 — route: package — deps: T006, T007
- [x] T009 [US2] `deliverWebhook` and the testing-module plugin in `packages/communication/webhooks/src/testing/` — covers: FR-002, P-002 — route: package — deps: T005
- [x] T010 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T009
- [x] T011 [US1] Changeset `.changeset/webhooks-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T011

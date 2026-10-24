# Tasks: `@stackra/notifications` wave 4

**Input**: `.agents/specs/sta-348-notifications/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-notifications/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/communication/notifications` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `Notification` and `NotificationBase` in `packages/communication/notifications/src/core/bases/notification.base.ts`, with `NotificationCategory`, `NotificationOptions`, `Recipient` and `MailMessage` in `packages/communication/notifications/src/core/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US1] `prepareNotification` in `packages/communication/notifications/src/core/functions/prepare-notification.function.ts` and `NotificationDelivery` in `packages/communication/notifications/src/core/types/notification-delivery.type.ts` — covers: FR-003, P-003 — route: package — deps: T003
- [x] T005 [US2] `Notifier`, `MemoryNotifierDriver`, `NotificationsOptions`, the shipped schema and `NotificationsConfig` in `packages/communication/notifications/src/core/` and `packages/communication/notifications/src/config/notifications.config.ts` — covers: FR-004, P-004 — route: package — deps: T004
- [x] T006 [US4] `MailTransport` and `OutboundMail` in `packages/communication/notifications/src/contracts/` — covers: FR-005, P-005 — route: package — deps: T002
- [x] T007 [US3] `useMail`, `MailProps`, the renderer and `htmlToText` in `packages/communication/notifications/src/react/mail/` and `packages/communication/notifications/src/core/functions/html-to-text.function.ts` — covers: FR-006, P-006 — route: package — deps: T003
- [x] T008 [US3] `renderMail`, `MemoryNotifier` and `MailTransportFake` in `packages/communication/notifications/src/testing/` — covers: FR-007, P-007 — route: package — deps: T005, T006, T007
- [x] T009 [US1] Stand-in barrels of the four entries and their export-list tests in `packages/communication/notifications/src/` — covers: FR-001, FR-002 — route: package — deps: T008
- [x] T010 [US1] Tests for every public symbol in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T009
- [x] T011 [US1] Changeset `.changeset/notifications-package.md`; `oxfmt`, `oxlint` and `validate-repository` clean — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 [US1] Run the package's tests, typecheck (TypeScript 7.0.2 and 6.0.3) and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T010

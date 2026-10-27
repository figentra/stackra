---
"@stackra/notifications": minor
---

<!--
Stackra file contract:
Purpose: the release note of stackra-207 (STA-1360) for @stackra/notifications.
Boundary: documentation only.
Runtime: none
Governing contract: ADR 0177 (changesets); stackra-207.
-->

Add `NotificationDeliveryEvent` (`./contracts`: `deliveryId`, `channel`, `provider`, `status` of sent, delivered,
failed or revoked, and `at`) and the `DeliveryRecorded` integration event (`notifications.delivery.recorded.v1`). The
mail, SMS, WhatsApp and push transports take an optional `EventOutbox` (and the connection transports an optional
`Clock`) and record each sent, refused or revoked delivery through it. New dependency: `@stackra/events`.

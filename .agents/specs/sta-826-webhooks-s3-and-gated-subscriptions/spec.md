# Feature Specification: S3 delivery and entitlement-gated webhook subscriptions

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-826

**Clarifications status**: complete

**Input**: OS gate-A gap (audit SPEC gap 7): no S3 delivery target (OS-288) and no entitlement gate on webhook subscriptions.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/communication/webhooks
- **Cross-service events**: none
- **Tenancy and data**: endpoints and grants are per scope node
- **Secrets**: none (S3 uses the platform role; signing secrets unchanged)
- **ADR needed**: yes, 0422 (Proposed)
- **New dependencies**: `@aws-sdk/client-s3` (catalog) in @stackra/webhooks
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** An `s3://bucket/prefix?region=` endpoint receives each delivery as an object with the signed headers as metadata (`WebhookObjectSink`, `S3WebhookObjectSinkDriver`, `WebhookObjectSinkFake`).
- **FR-002** `registerOutboundWebhooks` rows may name an entitlement; `register` refuses and `subscribedTo` skips a gated event without the grant (`WebhookEntitlementSource`, fail closed).

## Not built here

- The production `WebhookEntitlementSource` driver: the host.
- Runway granting the platform role `s3:PutObject` and the tenant bucket-policy guide: runway and docs.
- The lockfile entry for the new dependency: the orchestrator.
- Tests, typecheck and build are written but not run (owner mode).

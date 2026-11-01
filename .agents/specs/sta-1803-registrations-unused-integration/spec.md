# Specification: registrations import only the integrations they register

**Feature Branch**: `figentra/sta-1803-registrations-unused-integration`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1803

**Clarifications status**: complete

**Input**: 0.3.0 open gap from the billing and pay gates: `.stackra/gen/registrations.ts` imports an Integration that
has no Connection (`StripeConnectIntegration`, `TamaraSandboxIntegration`, `AwsTranscribeIntegration`,
`CheckoutSandboxIntegration`) and never reads it, which fails a consumer's `noUnusedLocals` (TS6133).

## Impact

- **Apps touched**: none
- **Services touched**: none in core; consumers' generated registrations change on their next gen
- **Packages touched**: `packages/developer/gen` (`emit-registrations.function.ts`, its test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (bug fix to generated output)
- **New dependencies**: none
- **Deploy modes**: all, no change
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R1 (generated code only)

## Requirements

- **FR-001** `registerConnections` imports an integration and its connection only when both resolve; an integration
  without a connection is neither imported nor registered.
- **FR-002** A test: an integration with no connection leaves no import in the registrations.

## Status history

- 2026-11-01 → Clarified (gate finding)

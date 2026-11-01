# Specification: the events testing plugin connects only listeners the app can build

**Feature Branch**: `figentra/sta-1740-events-connect-buildable`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1740

**Clarifications status**: complete

**Input**: The 0.2.2 gate (box 2) failed four `@stackra/webhooks` tests with "Nothing binds QueueService". Since STA-1740,
`@stackra/database/testing` imports `@stackra/events/testing`, which registers the events testing plugin in every
suite that loads the database testing entry. The plugin's `bus.connect(app)` builds each registered listener the app
`has`; `SendWebhooksListener` is in webhooks' generated wiring and needs `QueueService`, which the webhooks fixture app
does not boot.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/foundation/events` (the testing plugin and its test); `packages/foundation/container`
  (`UnboundTokenError`, the typed missing-binding error the plugin matches)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (testing harness behaviour; `EventBus.connect` already skips listeners of modules not booted)
- **New dependencies**: none
- **Deploy modes**: none (testing entry only)
- **Licence tier**: free
- **Docs to update**: events README (testing section)
- **Lane**: lite
- **Change risk**: R1 (testing entry only)

## Requirements

- **FR-001** The events testing plugin connects a registered listener only when the testing app can build it: a
  listener whose dependency nothing binds is skipped, as `connect` skips a listener of a module the app did not boot.
- **FR-002** Any other error building a listener still throws at compile.
- **FR-003** A test: a listener needing an unbound dependency is skipped and the app compiles.

## Status history

- 2026-11-01 → Clarified (gate finding)

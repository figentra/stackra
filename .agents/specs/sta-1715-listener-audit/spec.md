# Feature Specification: Listeners are audited like actions

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1715

**Clarifications status**: complete

**Input**: Leader: OS identity issues device credentials from a listener; listeners have no audit while actions do

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/events, @stackra/actions
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R2

## Behaviour

Every successful listener delivery writes one ListenerAuditTrail entry (default-on, like every action call): the system actor that handled it, the event's id as correlation, the event's actor as causedBy, and the fields the listener added with ctx.audit (never a classified value), inside the delivery's transaction; the actions package's outbox driver writes it as audit_entry.recorded

## Status history

- 2026-10-30: Draft → Clarified

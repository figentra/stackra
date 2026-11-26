# Feature Specification: a verified producer on every delivered event, and erasure that reports what it cannot reach

**Feature Branch**: `figentra/sta-1792-outbox-verified-producer`

**Created**: 2026-11-26

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Tier**: feature

**Approver**: the CTO (the change risk's approval stop)

**Linear**: STA-1792 (with STA-2629)

**Clarifications status**: complete

**Input**: Two production-readiness gaps of the outbox (readiness item 10.3). First, a listener could not tell which
service published an event: `ListenerContext` carried no producer, `ctx.actor` is not proof of origin, and the approval
executor relied on an interim `ApprovalGrantOrigin` port (STA-1724, ADR 0509 decision 7). Second, erasure
(`redactSubjectMessages`) runs in the subject's tenant, so a platform message (no tenant, `outbox.0006`) that holds the
subject's id was "rewritten" with zero rows changed and nothing reported, and nothing stopped a writer from putting
personal data in such a message.

### Sources

- `packages/foundation/events/src/core/services/event-bus.service.ts`, `src/core/types/listener-context.type.ts`
- `packages/runtime/outbox/src/node/services/{outbox-relay,inbox,relay-inbox,cross-app-fan-out}.service.ts`,
  `src/node/drivers/{inbox-event-publisher,postgres-outbox}.driver.ts`, `src/node/functions/insert-messages.function.ts`,
  `src/core/functions/redact-subject-messages.function.ts`
- `packages/developer/gen/src/core/functions/{emit-encore-events,emit-boot}.function.ts`
- `packages/application/actions/src/node/listeners/approval-executor.listener.ts`
- `packages/security/privacy/src/node/workflows/erase-subject.workflow.ts`
- ADR 0509 (decision 7), ADR 0511 (decisions 11 and 19), ADR 0239 (2026-11-07 amendment, gap C), ADR 0189 (decision 2)

## Impact

- **Apps touched**: docs only (`apps/docs/src/docs/build/approvals.mdx`)
- **Services touched**: none directly; every generated service gets the new subscription handlers and boot line on its
  next `stackra gen`
- **Packages touched**: events, outbox, gen, actions, privacy
- **Public contract change**: `ListenerContext.producer?`; `RecordedEvent.producer?`;
  `EventBus.deliver(event, meta, producer?)`; `deliverRemoteEvent(type, values, meta?, producer?)`;
  `EventEnvelope.producer?`; `InboxService.receive(envelope, producer?)`;
  `OutboxRelayService.connect(resolver, { service? })`; `OutboxDriver.rewrite(): Promise<boolean>`;
  `redactSubjectMessages(): Promise<SubjectRedaction>`; new `SubjectRedaction`, `PlatformPersonalEventError`
  (`platform_personal_event`), `ApprovalsConfig` (`actions.approvals`), `ApprovalsOptions`, `ApprovalsConfig$`;
  `EraseSubjectOutput.unredacted`; removed `ApprovalGrantOrigin`
- **Cross-service events**: no event schema changes; the envelope gains an optional `producer` stamped by the relay
- **Tenancy and data**: no migration; the insert reads `app.tenant_id` once for a batch holding a classified event
- **Security and privacy**: the producer of a delivery is proven by its transport, never claimed by the body; personal
  data cannot be written to a platform message; an erasure that cannot reach a held message says so
- **Secrets**: none
- **ADR needed**: no new ADR; implements ADR 0509 decision 7 (replacing the interim port) and ADR 0239's gap C rule
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/runtime/outbox/{README,AGENTS}.md`, `packages/foundation/events/README.md`,
  `packages/application/actions/README.md`, `packages/security/privacy/AGENTS.md`,
  `apps/docs/src/docs/build/approvals.mdx`, two changesets
- **Lane**: full
- **Change risk**: R3 (the trust decision behind executing approved actions; erasure completeness; breaking changes to
  two public ports)

## Acceptance criteria

- **AC-001**: THE bus SHALL set `ctx.producer` only from `deliver`'s `producer` argument, SHALL drop a `producer` key
  in the metadata, and SHALL set none for a dispatched event.
- **AC-002**: THE relay SHALL stamp every published envelope's `producer` with the service `connect` was given, never
  a value from the stored message, and none when it was given none.
- **AC-003**: THE inbox SHALL hand listeners and relays as `ctx.producer` only the producer its caller verified, never
  `envelope.producer` or a `producer` in `envelope.meta`.
- **AC-004**: THE cross-app inbox SHALL pass the verified signer as the producer; THE in-process publisher SHALL pass
  its own relay's stamp; each generated Encore subscription SHALL pass its topic's owning service; THE generated boot
  SHALL connect the relay with the service's member.
- **AC-005**: THE cross-app fan-out SHALL never send `producer` (ADR 0511 decision 19).
- **AC-006**: THE approval executor SHALL act only when `ctx.producer` equals `ApprovalsConfig.storeService`, and on no
  delivery while that is empty; `ApprovalGrantOrigin` SHALL no longer exist.
- **AC-007**: `OutboxDriver.rewrite` SHALL answer whether the row changed; the Postgres driver SHALL answer `false` for
  a row row security hides from the caller.
- **AC-008**: `redactSubjectMessages` SHALL count a matching message it could not rewrite as `unrewritable`, never as
  rewritten; THE erasure saga SHALL report it as the receipt's `unredacted`, and SHALL read a run stored before this
  change.
- **AC-009**: THE message insert SHALL refuse, before writing, a batch holding an event whose class declares a
  `@Classified` field when the transaction has no tenant (`PlatformPersonalEventError`), and SHALL read no tenant for
  a batch without one.

## Out of scope

- A version bump of `privacy.subject.erased.v1` to carry `unredacted`: the event schema is unchanged; the count is in
  the action's receipt.
- Flagging personal events at gen time: the runtime refusal covers both writers (the flush writer and `EventOutbox`).
- The OS tasks-approvals repository: its `ApprovalGrantOrigin` driver is dropped and `actions.approvals.storeService`
  set there when it takes this release.

## Status history

- 2026-11-26 · — → Implementing · Claude (readiness batch 10, item 10.3) · spec written from the built change.

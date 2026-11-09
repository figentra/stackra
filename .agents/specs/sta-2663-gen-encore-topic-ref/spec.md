# Feature Specification: gen hands Encore topics to the broker as publisher refs

**Feature Branch**: `figentra/gen-encore-topic-ref`

**Created**: 2026-11-09

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2663

**Clarifications status**: complete

**Input**: RUNWAY's Encore build spike on Pay (pay#217) fails with Encore's "invalid topic usage". gen's
`events.ts` and `queues.ts` pass each generated `Topic` bare as a property value,
`registerBrokerTopics([{ name, topic: queueDefault }])`, and Encore's static parser allows a topic only as a
constructor argument, a `publish` call, or `topic.ref<Publisher>()`. Every service with an integration event or a job
queue fails its Encore build, so no product deploys.

### Sources

- `packages/developer/gen/src/core/functions/emit-encore-events.function.ts`
- `packages/developer/gen/src/core/functions/emit-encore-queues.function.ts`
- `packages/runtime/queue/src/core/functions/register-broker-topics.function.ts` (needs only `publish`)
- Encore 1.58.8 `tsparser/src/parser/resources/infra/pubsub_topic.rs` (`resolve_topic_usage`: `ref` with a type
  argument named `Publisher`; any other usage is "invalid topic usage") and `runtimes/js/encore.dev/pubsub/refs.ts`
  (`abstract class Publisher<Msg extends object>`)
- Encore docs, TypeScript Pub/Sub, "Using topic references"

## Impact

- **Apps touched**: none
- **Services touched**: none (their generated `.stackra/encore` output changes on the next gen)
- **Packages touched**: packages/developer/gen (two emitters, their tests, the golden files)
- **Public contract change**: none; the generated files register the same names, each with a publisher ref
- **Cross-service events**: none; topic names and subscriptions are unchanged
- **Tenancy and data**: none
- **Security and privacy**: none; a `Publisher` ref grants the publish permission the service already uses
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: none
- **Lane**: full
- **Change risk**: R1 (generated-code shape only; the runtime reads the same `publish` method)

## Acceptance criteria

- **AC-001**: THE generated `events.ts` SHALL register each integration topic as
  `<topic>.ref<Publisher<BrokerMessage>>()`, importing `Publisher` from `encore.dev/pubsub`.
- **AC-002**: THE generated `queues.ts` SHALL register each queue topic the same way.
- **AC-003**: THE generated files SHALL hand no `Topic` to a function other than as a constructor argument or through
  `ref`.

## Status history

- 2026-11-09 → Clarified (the cause is Encore's topic-usage rule; the fix is the form Encore documents)
- 2026-11-09 → Planned (plan.md) — Approved by leader 2026-11-09 (P0 for 0.33.x)
- 2026-11-09 → Tasked (built in the same branch)

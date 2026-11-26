# Feature Specification: gen's Encore topic files pass Encore's parser

**Feature Branch**: `figentra/sta-2666-encore-topic-files`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2666

**Clarifications status**: complete

**Input**: RUNWAY's Encore build spike on Pay (pay#217) stops on two faults in gen's output, P0-2 and P0-3 of the
0.33.1 Encore build list:

1. Encore's parser refuses a `Topic` handed around as a value ("invalid topic usage"). `events.ts` and `queues.ts`
   registered each topic bare with `registerBrokerTopics([{ name, topic }])`. Encore allows a topic only as a
   constructor argument, a `publish` call, or `topic.ref<P>()` with `P` named `Publisher` (was stackra#1010).
2. Encore cannot resolve the message type a `Topic` or `Subscription` names when it comes from a package's dist:
   `BrokerMessage` from `@stackra/queue/contracts` is declared in a hashed `.d.mts` chunk Encore does not follow.

### Sources

- `packages/developer/gen/src/core/functions/emit-encore-events.function.ts`
- `packages/developer/gen/src/core/functions/emit-encore-queues.function.ts`
- `packages/developer/gen/src/core/functions/generate-member.function.ts`
- `packages/runtime/queue/src/contracts/types/broker-message.type.ts` (the shape)
- `packages/runtime/queue/src/core/functions/register-broker-topics.function.ts` (needs only `publish`)
- Encore 1.58.8 `tsparser/src/parser/resources/infra/pubsub_topic.rs` (`resolve_topic_usage`) and
  `runtimes/js/encore.dev/pubsub/refs.ts` (`abstract class Publisher<Msg extends object>`)
- The RUNWAY spike verdict of 2026-11-10 (NOT YET; every blocker in core)

## Impact

- **Apps touched**: none
- **Services touched**: none (their generated `.stackra/encore` output changes on the next gen)
- **Packages touched**: packages/developer/gen (three emitters, one new, generate-member, tests, golden files)
- **Public contract change**: none; generated files register the same topics and carry the same message shape
- **Cross-service events**: none; topic names, subscriptions and delivery are unchanged
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
- **Change risk**: R1 (generated-code shape only; the runtime reads the same `publish` and the same message)

## Acceptance criteria

- **AC-001**: THE generated `events.ts` and `queues.ts` SHALL register each topic as
  `<topic>.ref<Publisher<BrokerMessage>>()`, importing `Publisher` from `encore.dev/pubsub`.
- **AC-002**: WHEN a service's generated Encore files name `BrokerMessage` THE generator SHALL write
  `.stackra/encore/<member>/broker-message.ts` declaring it, and those files SHALL import it from `./broker-message`,
  not from a package.
- **AC-003**: THE generated `BrokerMessage` declaration SHALL have exactly the members of `@stackra/queue`'s
  `BrokerMessage`, with the same names, readonly flags and types.

## Status history

- 2026-11-10 → Clarified (both faults are Encore parser rules; the fixes are the forms Encore resolves)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (option a, with the drift test)
- 2026-11-10 → Tasked (tasks.md; built in the same branch, stackra#1010 squashed in)

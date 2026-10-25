---
"@stackra/state-machine": minor
---

Add `@stackra/state-machine`, the lifecycle of one model field (ADR 0161, 0294 note): the
`StateMachine<Model>({ field, history })` kind base with inherited `can` and `available`, and the `@Transition({ from, to })`
method decorator, whose call checks the `from` precondition, runs the body in the caller's unit of work, writes `to` and
records a `StateTransitioned` domain event, refusing with `TransitionNotAllowedError` (`transition_not_allowed`).

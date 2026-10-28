---
"@stackra/ai": patch
---

The guardrail options (`PatternGuardrailOptions`, `PiiGuardrailOptions`, `InjectionGuardrailOptions`,
`ClassifierGuardrailOptions`) are now abstract classes exported at runtime, so each guardrail driver's constructor
takes a class token that `stackra gen` and the container accept. Object literals still fit; a host that lets the
container build a layer binds the options token with `useValue`.

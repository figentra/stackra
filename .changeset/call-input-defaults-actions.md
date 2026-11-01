---
"@stackra/actions": patch
---

`CallInput<T>` is now `InputFields<InputOf<T>>` (STA-1694): a field with an initializer is optional in `run()`,
`ctx.dispatch`, the queue, the scheduler and the generated client call, as the parse accepts. `handle` still receives the
full class. Run `stackra gen` to see it; until then every field stays required.

---
"@stackra/devtools-kit": minor
---

Add `@stackra/devtools-kit`, the devtools kit of ADR 0246: `DevtoolsKit`, a service each package's devtools entry
takes by type to define data tabs (`defineTab`) and RPC functions (`defineRpc`) and to emit stream entries; every
event the in-process `EventBus` delivers joins the stream on `DEVTOOLS_BUS_CHANNEL`; one host (the app panel or the
`stackra dev` console) attaches at a time and reads tabs, calls RPC functions and replays the newest 500 entries
through a `DevtoolsSession`, with sensitive tabs withheld unless the host accepts them and host callback failures
isolated; failures carry a snake_case `DevtoolsError` code.

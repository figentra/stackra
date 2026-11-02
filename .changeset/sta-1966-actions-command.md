---
"@stackra/actions": minor
"@stackra/contracts": minor
---

An action or query can declare `command` and run as a console command (STA-1966). `ActionCommand(Action, Input, { name })`
in `@stackra/actions/node` builds the command class: its options are the input schema's fields, and it runs the call
through the action pipeline as the signed-in `CommandActor`. With nobody signed in, the run is refused before the
action starts. The manifest's command rows may carry `action`, `input` and `group`.

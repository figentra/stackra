---
"@stackra/actions": minor
"@stackra/gen": minor
---

A generated action command takes the app's container as its resolver (STA-1966). `#stackra/commands` exports
`ACTION_COMMANDS`, and the generated console entry builds those classes with the container and leaves every other
command to it. Sign-in, prompts and groups still use plain errors and options until the console stack merges; a small
follow-up switches them to `CommandError`, `prompt` and `group`.

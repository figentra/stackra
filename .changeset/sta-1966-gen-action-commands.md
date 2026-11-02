---
"@stackra/gen": minor
---

Gen writes a console command for each action or query that declares `command` (STA-1966). The row names the action and
its input class, `#stackra/commands` declares `<Action>Command extends ActionCommand(...)`, and a bad name or an
action with no input class is refused with `command_name_invalid` or `command_input_missing`. Hosted package commands
now come through the shared contribution walk and still refuse a name two owners declare.

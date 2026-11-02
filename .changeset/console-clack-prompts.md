---
"@stackra/console": minor
---

Clack (`@clack/prompts` 1.8.1) is the interactive prompter: `nodePorts()` asks through `clackPrompter`, and
`terminalPrompter` stays as a driver (STA-1966, owner approval 2026-11-02).

`@Argument` and `@Option` take `prompt` and `choices`.

- **Prompted fields:** a prompted field the invocation leaves out is asked for while interactive. A flag is a confirm,
  a field with choices is a select (a multiselect for a `@List`), a secret is a password, and anything else is text
  checked like a command-line token.
- **Without a terminal:** a prompted field takes its default, or the run exits 2 naming the option.
- **Arguments:** a prompted argument is no longer required on the command line.
- **Choices:** a value outside a field's `choices` is a usage error.

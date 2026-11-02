---
"@stackra/console": minor
---

Tab completion for every console (STA-1966):

- **The script:** `<bin> completion bash|zsh|fish` prints a script; source it in the shell's profile.
- **The callback:** the script's hidden `<bin> complete -- <words>` answers with:
  - command names and spaced subcommands (`mcp sync`);
  - each command's options and the global options;
  - choice values.

  Hidden commands are left out.

- **Behind a port:** the `Completions` port (`@stackra/console/contracts`) carries this. `TabCompletionsDriver`
  (Bombshell Tab, `@bomb.sh/tab` 0.0.22) is bound by `nodePorts()`, and `runCommandForTest` takes `completions`.
- **Reserved names:** `completion` and `complete` are built in, like `help`; no command may take their names.

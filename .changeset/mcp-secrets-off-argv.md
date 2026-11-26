---
"@stackra/mcp": minor
"@stackra/cli": minor
"@stackra/flow-preset": patch
---

`stackra mcp exec` keeps MCP server secrets off argv (STA-1617). Name each secret with
`stackra mcp exec --env NAME[,NAME…] -- <command>`: sops decrypts it into the server's environment, where the server
reads it, so no value shows in a process listing. A `$NAME` reference on the server's command line is now refused by
`mcpExecCommand` and by the `.mcp.yaml` check (new issue code `secret_on_argv`); `McpExecOptions` gains `secrets`.
Migrate `--api-key $X` to `--env X --` (the server reads its environment), and a header token to mcp-remote's
`--header-file` with a `${X}` placeholder. The flow preset's secrets rule says the same.

---
"@stackra/mcp": minor
---

`stackra mcp` serves MCP resources and prompts as well as tools (STA-2919), so an assistant whose client has no skills
support still gets Stackra's conventions and recipes from the server. `initialize` now advertises `resources` and
`prompts`. `resources/list` and `resources/read` serve `stackra://guidelines` (the always-on rules of `@stackra/skills`
in full, the rules and skills to read on request, and the steps every change ends with), `stackra://manifest` (every
committed `stackra.manifest.json`) and `stackra://manifest/<member>`, and `stackra://rules/<name>` and
`stackra://skills/<name>`; `resources/templates/list` names the per-item URIs, and an unknown URI answers `-32002`.
`prompts/list` and `prompts/get` serve `add-feature`, `fix-gen-drift` and `explain-refusal`, recipes over the server's
own tools that attach the manifest or skill they need and each end with `stackra gen`, `stackra gen --check` and the
tests (through a `test` tool when the server lists one, otherwise `verify`); an unknown prompt or a missing or invalid
argument answers `-32602`. `ServeLocalMcpOptions` takes an optional `skills` (the agent documents to serve; default
`loadSkillSet()`), and the package now depends on `@stackra/skills`.

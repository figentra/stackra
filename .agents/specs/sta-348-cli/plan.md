# Plan: `@stackra/cli` wave 3

**Spec**: `.agents/specs/sta-348-cli/spec.md`

1. **Command core** (`src/node/functions/`): a `CliCommand` is data plus `run` (the folded `console` framework);
   `findCommand` picks the longest name, `runCli` parses with `node:util` `parseArgs` (strict, `--` passthrough), runs
   the command and maps outcomes to exit codes. `CliIo` carries output, so the binary (`PROCESS_IO`) and the MCP
   (`captureIo`) share one core.
2. **Gen** (`runGen`, `GEN_COMMAND`): `generate` from `@stackra/gen/node`, refusals through `formatGenError`; at the
   workspace root, every `stackra.config.ts` member from `pnpm-workspace.yaml` (`workspaceMembers`, `node:fs`
   `globSync`).
3. **Tools** (`readMember`, `resolveTool`, `toolCommand`, `runProcess`): layout from the `define*` call, targets from
   the manifest gen just wrote; one closed switch per task picks the tool and passes `.stackra/<tool>` configs that
   exist; the workspace root fans out through `turbo run`.
4. **ls** (`LS_COMMAND`, `MANIFEST_IDENTITIES`): read committed manifests, print identities.
5. **MCP and agents**: thin commands over `serveLocalMcp`, `syncMcpConfig`, `checkMcpConfig`, `execWithSecrets`.
6. **Binary**: `src/node/stackra.ts`, built by tsdown to `dist/stackra.mjs`. Authored tool configs until STA-339.

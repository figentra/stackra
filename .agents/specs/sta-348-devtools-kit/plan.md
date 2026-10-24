# Plan: `@stackra/devtools-kit`

**Spec**: `.agents/specs/sta-348-devtools-kit/spec.md`

1. **Member files**: `package.json` (entry `.`, workspace versions only), `tsconfig.json` (decorators preset, for
   `@stackra/validation`'s source reached through `@stackra/events`), `turbo.jsonc` (`tier:lib`), `stackra.config.ts`,
   authored tool configs until gen writes them (STA-339), README, AGENTS, LICENSE, ORIGIN.
2. **Kit** (`src/core/services/devtools-kit.service.ts`): a `Service` taking `EventBus` and `Clock`. Maps for tabs and
   RPC functions (latest definition wins; removers compare identity), a bounded buffer for the stream, and a tap
   listener (a class expression, so gen never registers it) subscribed to `Event` on the bus.
3. **Host session**: one host at a time; the session filters sensitive tabs, reads and calls asynchronously, replays
   the buffer and fails with `detached` after `detach()`. Host callbacks run isolated.
4. **Errors, constants, types**: one declaration per file in `src/core/{errors,constants,types}/`.
5. **Tests** beside each public symbol; **changeset** `.changeset/devtools-kit-package.md`.

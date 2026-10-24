# Plan: `@stackra/runway` wave 2

**Spec**: `.agents/specs/sta-348-runway/spec.md`

1. **Schemas as zod constants** (`src/core/constants/`): small parts (port, key, secret names, config values, var
   value, requirement, instances), then the app and service environment and runway schemas, the topology, root
   environment and root runway schemas, and the runway facts schema. Member objects are strict, so root keys fail;
   the root's provider blocks stay open. Enums through `Enum.of` from `@stackra/contracts`; `url()` from
   `@stackra/validation`.
2. **One lookup** (`RUNWAY_SCHEMAS`) feeds `parseRunway` and `runwayJsonSchema`, so the parsed type and the committed
   `schema/<kind>.json` cannot drift; a test compares the files with the derivation.
3. **Placement** is a pure function over a parsed root and a member list, returning every failure.
4. **Facts**: one resolved document shape for `.stackra/dev/ports.json` and for the `__STACKRA_RUNWAY__` define. The
   `.` readers prefer the injected document, then walk up for the dev file through `process.getBuiltinModule`, so the
   entry stays bundle-safe. `definesFor` (`./node`) builds the define map; `devServer` builds the Vite server block.
5. **Stand-in barrels and authored tool configs** until gen writes them (STA-339), as in wave 1.

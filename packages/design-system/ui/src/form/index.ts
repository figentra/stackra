/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./form` entry of @stackra/ui, the platform-neutral form engine (a zod schema's
 *          react-hook-form resolver and defaults, the schema form handle and the field descriptor) that the `./react`
 *          and `./native` `useSchemaForm`, `Form` and `Field` build on, until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `contracts` and `core` only; nothing React DOM or React
 *           Native. An app takes `useSchemaForm` and `Field` from its renderer entry, not from here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0165 (decision 2: `./form`); owner decision 12 of 2026-10-25; the
 *                     STA-347 stand-in barrel decision.
 */
export { schemaDefaults } from "#form/functions/schema-defaults.function";
export { schemaResolver } from "#form/functions/schema-resolver.function";
export { useSchemaField } from "#form/schema-form/use-schema-field";
export { useSchemaFormHandle } from "#form/schema-form/use-schema-form-handle";
export type { SchemaFormHandle } from "#form/types/schema-form-handle.type";
export type { SchemaFormOptions } from "#form/types/schema-form-options.type";

/**
 * Stackra file contract:
 * Purpose: `SchemaForm<T>`, what the native `useSchemaForm` returns and a screen's hook hands to `Form form={...}`:
 *          react-hook-form's form over the schema, with `field(name)` and a `handleSubmit` that returns its result.
 * Boundary: a type only: the native name of `./form`'s engine handle, which a screen's own state type names.
 * Runtime: react-native
 * Governing contract: ADR 0055; ADR 0165 (decision 2); ADR 0302 (decision 3).
 */
import type { FieldValues } from "react-hook-form";

import type { SchemaFormHandle } from "#form/types/schema-form-handle.type";

/** A native schema form over the values `T`. */
export type SchemaForm<T extends FieldValues> = SchemaFormHandle<T>;

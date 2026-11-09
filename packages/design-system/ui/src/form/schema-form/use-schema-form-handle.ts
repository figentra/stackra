/**
 * Stackra file contract:
 * Purpose: `useSchemaFormHandle(Schema, options)`, the form engine both renderers' `useSchemaForm` build on: a
 *          react-hook-form form validated by the class's registered zod schema, opened with the schema's defaults under
 *          the caller's, showing the server's field errors, with `field(name)` bindings and a `handleSubmit` that hands
 *          back the submit's result.
 * Boundary: platform-neutral React (react-hook-form only), no React DOM and no React Native. The schema is the one gen
 *           registers for the class (`schemaOf`), so the browser and the server validate with the same rules; the form
 *           itself is `useZodFormHandle`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0055 (decisions 1 to 3); ADR 0165 (decision 2); ADR 0140 (field errors); ADR 0302
 *                     (decision 3).
 */
import { schemaOf } from "@stackra/validation";
import type { FieldValues } from "react-hook-form";

import { useZodFormHandle } from "#form/schema-form/use-zod-form-handle";
import type { SchemaFormHandle } from "#form/types/schema-form-handle.type";
import type { SchemaFormOptions } from "#form/types/schema-form-options.type";

/**
 * A form over `type`'s schema.
 *
 * @example
 * const form = useSchemaFormHandle(ContactInput, { serverErrors: fieldErrors });
 * <TextField {...form.field("email")} label="Email" />
 */
export function useSchemaFormHandle<T extends FieldValues>(
  type: abstract new (...args: never[]) => T,
  options: SchemaFormOptions<T> = {},
): SchemaFormHandle<T> {
  return useZodFormHandle<T>(schemaOf(type), options);
}

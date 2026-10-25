/**
 * Stackra file contract:
 * Purpose: the native `useSchemaForm(Schema, options)`: the schema form of `./form` (react-hook-form over the class's
 *          registered zod schema, opened with its defaults under the caller's, `field(name)`, the server's field
 *          errors) whose `handleSubmit` returns what the submit returned, for a button's `onPress`.
 * Boundary: the native part of the form adapter; the engine is `#form`. A screen has no native post, so there is no
 *           `handleNativeSubmit` here.
 * Runtime: react-native
 * Governing contract: ADR 0055; ADR 0165 (decision 2: form adapters in @stackra/ui); ADR 0302 (decision 3).
 */
import type { FieldValues } from "react-hook-form";

import { useSchemaFormHandle } from "#form/schema-form/use-schema-form-handle";
import type { SchemaFormOptions } from "#form/types/schema-form-options.type";
import type { SchemaForm } from "#native/schema-form/schema-form.type";

/**
 * A form over `type`'s schema, for a screen.
 *
 * @example
 * const form = useSchemaForm(CreateOrderForm, { defaultValues: { quantity: 1 } });
 * const submit = form.handleSubmit((values) => create.run(values));
 */
export function useSchemaForm<T extends FieldValues>(
  type: abstract new (...args: never[]) => T,
  options?: SchemaFormOptions<T>,
): SchemaForm<T> {
  return useSchemaFormHandle(type, options);
}

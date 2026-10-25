/**
 * Stackra file contract:
 * Purpose: `useSchemaFormHandle(Schema, options)`, the form engine both renderers' `useSchemaForm` build on: a
 *          react-hook-form form validated by the class's registered zod schema, opened with the schema's defaults under
 *          the caller's, showing the server's field errors, with `field(name)` bindings and a `handleSubmit` that hands
 *          back the submit's result.
 * Boundary: platform-neutral React (react-hook-form only), no React DOM and no React Native. The schema is the one gen
 *           registers for the class (`schemaOf`), so the browser and the server validate with the same rules. A
 *           server error stays on its field until that field changes. Validation runs on submit, then on every change.
 * Runtime: isomorphic
 * Governing contract: ADR 0055 (decisions 1 to 3); ADR 0165 (decision 2); ADR 0140 (field errors); ADR 0302
 *                     (decision 3).
 */
import { schemaOf } from "@stackra/validation";
import { type BaseSyntheticEvent, useEffect } from "react";
import { type DefaultValues, type FieldPath, type FieldValues, useForm } from "react-hook-form";

import { bindFormField } from "#core/functions/bind-form-field.function";
import { schemaDefaults } from "#form/functions/schema-defaults.function";
import { schemaResolver } from "#form/functions/schema-resolver.function";
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
  const schema = schemaOf(type);
  const form = useForm<T>({
    resolver: schemaResolver<T>(schema),
    defaultValues: { ...schemaDefaults(schema), ...options.defaultValues } as DefaultValues<T>,
  });
  const { serverErrors } = options;
  const { setError } = form;

  useEffect(() => {
    for (const [path, message] of Object.entries(serverErrors ?? {}))
      setError(path as FieldPath<T>, { type: "server", message });
  }, [setError, serverErrors]);

  return {
    ...form,
    field: (name) =>
      bindFormField(
        {
          name,
          value: form.watch(name),
          onChange: (value) => {
            form.clearErrors(name);
            form.setValue(name, value, {
              shouldDirty: true,
              shouldValidate: form.formState.isSubmitted,
            });
          },
          onBlur: () => {
            if (form.formState.isSubmitted) void form.trigger(name);
          },
        },
        form.getFieldState(name, form.formState),
      ),
    handleSubmit:
      <R>(onValid: (values: T) => R | Promise<R>) =>
      async (event?: BaseSyntheticEvent): Promise<R | undefined> => {
        let result: R | undefined;
        await form.handleSubmit(async (values) => {
          result = await onValid(values as T);
        })(event);
        return result;
      },
  };
}

/**
 * Stackra file contract:
 * Purpose: the web `useSchemaForm(Schema, options)`: the schema form of `./form` (react-hook-form over the class's
 *          registered zod schema, `field(name)`, a `handleSubmit` that returns its result, the server's field errors)
 *          plus `handleNativeSubmit()`, the `onSubmit` of a form that posts without JavaScript's help: a valid form
 *          posts natively, an invalid one never leaves and shows its errors.
 * Boundary: the browser part of the form adapter; the engine is `#form`. `handleNativeSubmit` validates synchronously
 *           with the same schema, so a schema with an async refinement belongs on `handleSubmit` instead.
 * Runtime: browser
 * Governing contract: ADR 0055; ADR 0165 (decision 2: form adapters in @stackra/ui); ADR 0302 (decision 3).
 */
import { schemaOf } from "@stackra/validation";
import type { FormEvent } from "react";
import type { FieldValues } from "react-hook-form";

import { useSchemaFormHandle } from "#form/schema-form/use-schema-form-handle";
import type { SchemaFormHandle } from "#form/types/schema-form-handle.type";
import type { SchemaFormOptions } from "#form/types/schema-form-options.type";

/**
 * A form over `type`'s schema, for the web.
 *
 * @example
 * form = useSchemaForm(ContactInput, { serverErrors: this.props.fieldErrors });
 * <RouteForm method="post" onSubmit={this.form.handleNativeSubmit()}>
 *   <TextField {...this.form.field("email")} label={t(I18n.web.contact.email)} />
 * </RouteForm>
 */
export function useSchemaForm<T extends FieldValues>(
  type: abstract new (...args: never[]) => T,
  options?: SchemaFormOptions<T>,
): SchemaFormHandle<T> & {
  /** The `onSubmit` of a natively posted form: lets a valid form post, stops an invalid one and shows its errors. */
  readonly handleNativeSubmit: () => (event: FormEvent<HTMLFormElement>) => void;
} {
  const form = useSchemaFormHandle(type, options);
  return {
    ...form,
    handleNativeSubmit: () => (event) => {
      if (schemaOf(type).safeParse(form.getValues()).success) return;
      // Prevents the post, marks the form submitted and puts each error on its field.
      void form.handleSubmit(() => undefined)(event);
    },
  };
}

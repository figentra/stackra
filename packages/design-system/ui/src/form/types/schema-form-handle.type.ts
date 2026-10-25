/**
 * Stackra file contract:
 * Purpose: `SchemaFormHandle<T>`, the form both renderers' `useSchemaForm` return: react-hook-form's own form with
 *          `field(name)`, the binding to spread onto any design-system field, and a `handleSubmit` that validates and
 *          then hands back what the submit callback returned (`undefined` when validation failed).
 * Boundary: a type only, platform-neutral. Every other member is react-hook-form's (`watch`, `setValue`, `reset`,
 *           `formState`, `control`), so a form written for react-hook-form keeps working.
 * Runtime: isomorphic
 * Governing contract: ADR 0055; ADR 0165 (decision 2); ADR 0302 (decision 3: one API on web and native).
 */
import type { BaseSyntheticEvent } from "react";
import type { FieldPath, FieldPathValue, FieldValues, UseFormReturn } from "react-hook-form";

import type { FormFieldBinding } from "#contracts/types/form-field-binding.type";

/** A react-hook-form form over a schema, with field bindings and a submit that returns its result. */
export type SchemaFormHandle<T extends FieldValues> = Omit<UseFormReturn<T>, "handleSubmit"> & {
  /** The binding of the field at `name`: spread it onto a TextField, Checkbox, Select and the like. */
  readonly field: <N extends FieldPath<T>>(name: N) => FormFieldBinding<FieldPathValue<T, N>>;
  /**
   * Validates, then calls `onValid` with the parsed values; the returned handler resolves with its result, or with
   * `undefined` when a field failed (the errors are then on the fields).
   */
  readonly handleSubmit: <R>(
    onValid: (values: T) => R | Promise<R>,
  ) => (event?: BaseSyntheticEvent) => Promise<R | undefined>;
};

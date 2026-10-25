/**
 * Stackra file contract:
 * Purpose: `SchemaFormOptions<T>`, what a schema form starts from besides its schema: the caller's starting values,
 *          laid over the schema's own defaults, and the field errors a server answered with, by wire path.
 * Boundary: a type only. `serverErrors` is the `FieldErrors` shape of a refusal (a path to a code or message), typed
 *           structurally so this package does not depend on `@stackra/errors`.
 * Runtime: isomorphic
 * Governing contract: ADR 0055; ADR 0140 (field errors); ADR 0165 (decision 2).
 */
import type { DefaultValues, FieldValues } from "react-hook-form";

/** The options of `useSchemaForm`. */
export interface SchemaFormOptions<T extends FieldValues> {
  /** Starting values, over the schema's defaults; `undefined` keeps the schema's alone. */
  readonly defaultValues?: DefaultValues<T> | undefined;
  /** The field errors of the last server answer, by path; each is shown on its field until the field changes. */
  readonly serverErrors?: Readonly<Record<string, string>> | undefined;
}

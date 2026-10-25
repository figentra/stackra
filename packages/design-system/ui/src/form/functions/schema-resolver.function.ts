/**
 * Stackra file contract:
 * Purpose: `schemaResolver(schema)`, the react-hook-form resolver of a zod schema: valid values come back parsed (the
 *          schema's output, defaults and trimming applied), and each failing path gets the first message zod reports
 *          for it, nested the way react-hook-form reads errors (`lines.0.variantId`).
 * Boundary: pure and platform-neutral: no React DOM, no React Native. It replaces `@hookform/resolvers/zod`, so the
 *           package takes no new dependency. A schema message is shown as written; when it is an i18n key, the field
 *           that shows it translates it.
 * Runtime: isomorphic
 * Governing contract: ADR 0055 (decision 1: react-hook-form state, zod validation); ADR 0165 (decision 2: form
 *                     adapters in @stackra/ui).
 */
import { type FieldErrors, type FieldValues, get, type Resolver, set } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * The resolver that validates a form with `schema`.
 *
 * @example
 * const form = useForm({ resolver: schemaResolver(schemaOf(ContactInput)) });
 */
export function schemaResolver<T extends FieldValues>(schema: ZodType): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data as T, errors: {} };
    const errors: FieldErrors<T> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.map(String).join(".");
      // Zod reports the most basic failure of a field first; that is the one to fix first.
      if (get(errors, path) === undefined)
        set(errors, path, { type: issue.code, message: issue.message });
    }
    return { values: {}, errors };
  };
}

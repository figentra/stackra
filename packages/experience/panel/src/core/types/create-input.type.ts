/**
 * Stackra file contract:
 * Purpose: `CreateInput<M>`, the create input a resource's form keys are paths of when its `create` operation is `true`:
 *          the model's data fields without the ones the system writes.
 * Boundary: a type only. shortcut: approximated from the model's own fields (no methods, no id, stamps or soft delete);
 *           gen writes the exact generated input (`#stackra/schemas`) and this becomes its alias with STA-339.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: form keys come from the create or update input); ADR 0294 (decision 16).
 */

/** The fields the system writes on every model. */
type SystemField = "id" | "createdAt" | "updatedAt" | "deletedAt" | "createdBy" | "updatedBy";

/**
 * The writable data fields of model `M`.
 *
 * @example
 * override form(f: Form<CreateInput<Product>>) { return f.fields((x) => [x.from("title")]); }
 */
export type CreateInput<M> = {
  [
    K in keyof M as M[K] extends (...args: never[]) => unknown
      ? never
      : K extends SystemField
        ? never
        : K
  ]: M[K];
};

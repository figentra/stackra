/**
 * Stackra file contract:
 * Purpose: `cloudProjectOf(project, label)`, a runway GCP project (its id and number, each quoted or `ref:<path>`)
 *          resolved and checked: the id as GCP spells one, the number as digits only.
 * Boundary: internal; the check catches a stack config value YAML or JSON read as a number, or a project name given
 *           where the id belongs, before the id reaches a provider or the number an IAM member or budget filter.
 * Runtime: node
 * Governing contract: ADR 0354 (decisions 3 and 4), ADR 0171 (`ref:` values).
 */
import { resolveRef } from "#node/functions/resolve-ref.function";

/**
 * The resolved project.
 *
 * @param label - what the project is, for the error (`the production project`).
 * @throws TypeError when the id is not a GCP project id or the number is not digits.
 */
export function cloudProjectOf(
  project: { readonly id: string; readonly number: string },
  label: string,
): { id: string; number: string } {
  const id = resolveRef(project.id);
  const number = resolveRef(project.number);
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(id))
    throw new TypeError(`${label} id (${project.id}) is not a GCP project id`);
  if (!/^\d{1,20}$/.test(number))
    throw new TypeError(
      `${label} number (${project.number}) is not a GCP project number; quote it in the stack config`,
    );
  return { id, number };
}

/**
 * Stackra file contract:
 * Purpose: `useResourceForm(options)`, the state of a resource's Create or Edit form on either entry: the fields it
 *          draws (the recorded form fields its own action's input takes, else that input's own keys but the record
 *          id), the server's field errors and the submit that runs the action and then goes to the record's View
 *          page (or the list).
 * Boundary: platform-free: imports `react` and no UI kit, so the web and native `ResourceFormPage` draw the same form
 *           with their own kit. Registers the action's input schema under the action ref so `@stackra/ui`'s schema
 *           form reads it. The caller hands in its runner and how it goes to a page (push on the web, replace on a
 *           phone).
 * Runtime: isomorphic (react)
 * Governing contract: ADR 0307 (form keys; rule 3); ADR 0139 (declared confirmation); ADR 0055; ADR 0164.
 */
import type { ActionRef } from "@stackra/clients";
import { registerSchemas } from "@stackra/validation";
import { useState } from "react";

import { fieldsForInput } from "#core/functions/fields-for-input.function";
import { recordIdKey } from "#core/functions/record-id-key.function";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import type { FieldNode } from "#core/types/field-node.type";
import type { PageRef } from "#core/types/page-ref.type";
import type { ResourceRoutes } from "#core/types/resource-routes.type";
import { ActionRunStatus } from "#react/action-runner/action-run-status.enum";
import type { ActionRunner } from "#react/action-runner/action-runner.type";

/**
 * The form state of `resource` over `action`'s input.
 *
 * @example
 * const { fields, serverErrors, submit } = useResourceForm({ resource, action, recordId, run, go });
 */
export function useResourceForm({
  resource,
  action,
  recordId,
  run,
  go,
}: {
  readonly resource: ResourceRoutes;
  readonly action: ActionRef;
  readonly recordId?: string | undefined;
  readonly run: ActionRunner;
  /** Goes to `page`, for the record `id` when one is given. */
  readonly go: (page: PageRef, id?: string) => void;
}): {
  readonly fields: readonly FieldNode[];
  readonly serverErrors: Readonly<Record<string, string>>;
  readonly submit: (values: Readonly<Record<string, unknown>>) => Promise<void>;
} {
  const [serverErrors, setServerErrors] = useState<Readonly<Record<string, string>>>({});
  // The ref's input is its schema; the schema form reads schemas by class, so record it under the ref.
  useState(() => registerSchemas([[action, action.input]]));
  const idKey = recordIdKey(action.input, resource.key);
  // One recorded form serves Create and Edit: each page keeps the fields its own action takes.
  const recorded = fieldsForInput(resourceTreeOf(resource.key).form?.fields ?? [], action.input);
  // A resource without a form shows the input's own keys but the record id.
  const fields: readonly FieldNode[] =
    recorded.length > 0
      ? recorded
      : Object.keys((action.input as { readonly shape?: object }).shape ?? {})
          .filter((key) => key !== idKey)
          .map((key) => ({ kind: "value", key }));
  const view = (resource as ResourceRoutes & { readonly view?: PageRef }).view;
  const submit = async (values: Readonly<Record<string, unknown>>) => {
    const done = await run(action, values as never);
    if (done.status === ActionRunStatus.Refused) {
      setServerErrors(done.error.fieldErrors ?? {});
      return;
    }
    if (done.status !== ActionRunStatus.Done) return;
    const id = recordId ?? (done.data as { readonly id?: unknown } | undefined)?.id;
    if (view !== undefined && id !== undefined) go(view, String(id));
    else go(resource.list);
  };
  return { fields, serverErrors, submit };
}

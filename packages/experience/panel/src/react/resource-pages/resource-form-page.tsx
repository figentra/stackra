/**
 * Stackra file contract:
 * Purpose: `ResourceFormPage`, the generic Create and Edit page of any resource: the recorded form fields its own
 *          action's input takes (or that input's own keys) in a schema form over the create or update action's input, validated by that
 *          schema, submitted through the action runner, with the server's field errors on their fields; then the View
 *          page (or the list) of the record.
 * Boundary: registers the action's input schema under the action ref so `@stackra/ui`'s schema form reads it. On Edit
 *           it reads the record first (`useRecord`) and starts the form from it, the record id under the input's id
 *           key. The PUT address a create mints (ADR 0307: a client-minted id field) is not built; a record
 *           action's modal form is `ActionInputModal`.
 * Runtime: browser
 * Governing contract: ADR 0307 (form keys; rule 3); ADR 0139 (declared confirmation); ADR 0055.
 */
import type { ActionRef } from "@stackra/clients";
import { useTranslation } from "@stackra/i18n/react";
import { useNavigate } from "@stackra/navigation/react";
import {
  Button,
  ErrorState,
  Form,
  PageHeader,
  PageSkeleton,
  useSchemaForm,
} from "@stackra/ui/react";
import { registerSchemas } from "@stackra/validation";
import { useState, type ReactElement } from "react";
import type { ZodType } from "zod";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { fieldsForInput } from "#core/functions/fields-for-input.function";
import { recordIdKey } from "#core/functions/record-id-key.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import type { FieldNode } from "#core/types/field-node.type";
import type { PageRef } from "#core/types/page-ref.type";
import type { ResourceRoutes } from "#core/types/resource-routes.type";
import { ActionRunStatus } from "#react/action-runner/action-run-status.enum";
import { useActionRunner } from "#react/action-runner/use-action-runner";
import { ResourceFormField } from "#react/resource-pages/resource-form-field";
import type { ResourceFormPageProps } from "#react/resource-pages/resource-form-page.props";
import { useRecord } from "#react/resource-pages/use-record";

/** The fields a resource without a form shows: the input's own keys but the record id. */
const derived = (schema: ZodType, idKey: string | undefined): FieldNode[] =>
  Object.keys((schema as { readonly shape?: object }).shape ?? {})
    .filter((key) => key !== idKey)
    .map((key) => ({ kind: "value", key }));

/** The form over `action`'s input, started from `defaults`. */
function ResourceForm({
  resource,
  action,
  defaults,
  recordId,
}: {
  readonly resource: ResourceRoutes;
  readonly action: ActionRef;
  readonly defaults: Readonly<Record<string, unknown>>;
  readonly recordId?: string;
}): ReactElement {
  const { t } = useTranslation();
  const run = useActionRunner();
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState<Readonly<Record<string, string>>>({});
  // The ref's input is its schema; the schema form reads schemas by class, so record it under the ref.
  useState(() => registerSchemas([[action, action.input]]));
  const form = useSchemaForm(action as unknown as abstract new () => Record<string, unknown>, {
    defaultValues: defaults,
    serverErrors,
  });
  const idKey = recordIdKey(action.input, resource.key);
  // One recorded form serves Create and Edit: each page keeps the fields its own action takes.
  const recorded = fieldsForInput(resourceTreeOf(resource.key).form?.fields ?? [], action.input);
  const fields = recorded.length > 0 ? recorded : derived(action.input, idKey);
  const pages = resource as ResourceRoutes & { readonly view?: PageRef };
  const submit = async (values: Readonly<Record<string, unknown>>) => {
    const done = await run(action, values as never);
    if (done.status === ActionRunStatus.Refused) {
      setServerErrors(done.error.fieldErrors ?? {});
      return;
    }
    if (done.status !== ActionRunStatus.Done) return;
    const id = recordId ?? (done.data as { readonly id?: unknown } | undefined)?.id;
    if (pages.view !== undefined && id !== undefined) navigate(pages.view, { id: String(id) });
    else navigate(resource.list);
  };
  return (
    <Form form={form} submit={submit}>
      {fields.map((node, index) => (
        <ResourceFormField
          // oxlint-disable-next-line react/no-array-index-key -- reason: the items have no identity but their place in the list
          key={index}
          resourceKey={resource.key}
          schema={action.input}
          node={node}
        />
      ))}
      <Button type="submit" isLoading={form.formState.isSubmitting}>
        {t(PANEL_KEYS.panel.resources.save)}
      </Button>
    </Form>
  );
}

/** The Edit form, once the record is read. */
function EditForm({
  resource,
  action,
  id,
}: {
  readonly resource: ResourceRoutes;
  readonly action: ActionRef;
  readonly id?: string | undefined;
}): ReactElement {
  const { t } = useTranslation();
  const { id: recordId, answer } = useRecord(resource, id);
  if (answer.isPending)
    return <PageSkeleton loadingLabel={t(resourceLabel(resource.key, "title"))} />;
  if (answer.error !== null || typeof answer.data !== "object" || answer.data === null)
    return (
      <ErrorState
        title={t(PANEL_KEYS.panel.resources.failed)}
        error={answer.error}
        retry={{ label: t(PANEL_KEYS.panel.resources.retry), onPress: () => void answer.refetch() }}
      />
    );
  const idKey = recordIdKey(action.input, resource.key);
  return (
    <ResourceForm
      resource={resource}
      action={action}
      recordId={recordId}
      defaults={{ ...answer.data, ...(idKey === undefined ? {} : { [idKey]: recordId }) }}
    />
  );
}

/**
 * The Create or Edit page of `resource`.
 *
 * @throws TypeError when the resource has no create (or update) action.
 * @example
 * <ResourceFormPage resource={Resources.Order} mode="edit" />
 */
export function ResourceFormPage({ resource, mode, id }: ResourceFormPageProps): ReactElement {
  const { t } = useTranslation();
  const action = resource.operations[mode === "create" ? "create" : "update"] as
    | ActionRef
    | undefined;
  if (action === undefined)
    throw new TypeError(`${resource.key} has no ${mode === "create" ? "create" : "update"} action`);
  return (
    <>
      <PageHeader
        title={t(resourceLabel(resource.key, "title"))}
        description={t(PANEL_KEYS.panel.resources[mode])}
      />
      {mode === "create" ? (
        <ResourceForm resource={resource} action={action} defaults={{}} />
      ) : (
        <EditForm resource={resource} action={action} id={id} />
      )}
    </>
  );
}

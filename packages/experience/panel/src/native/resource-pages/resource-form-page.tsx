/**
 * Stackra file contract:
 * Purpose: the native `ResourceFormPage`, the generic Create and Edit page of any resource on a phone, as on the web: the
 *          recorded form fields its own action's input takes (or that input's own keys) in a schema form over the create
 *          or update action's input, validated by that schema, submitted through the native action runner, with the
 *          server's field errors on their fields; then the record's View page (or the list).
 * Boundary: registers the action's input schema under the action ref so `@stackra/ui`'s schema form reads it. On Edit
 *           it reads the record first (`useRecord`) and starts the form from it, the record id under the input's id
 *           key. A phone has no submit key: Save validates and sends. The next page is pushed by name with the native
 *           `useNavigate`, so the host registers screens under those names until gen does. The fields sit in a scroll
 *           view so the keyboard never hides the last one.
 * Runtime: react-native
 * Governing contract: ADR 0307 (form keys; rule 3); ADR 0139 (declared confirmation); ADR 0055; ADR 0164.
 */
import { useTranslation } from "@stackra/i18n/react";
import { useNavigate } from "@stackra/navigation/native";
import {
  Button,
  ErrorState,
  Form,
  PageHeader,
  PageSkeleton,
  useSchemaForm,
} from "@stackra/ui/native";
import type { ReactElement } from "react";
import { ScrollView } from "react-native";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { answerFailureOf } from "#core/functions/answer-failure-of.function";
import { formActionOf } from "#core/functions/form-action-of.function";
import { recordIdKey } from "#core/functions/record-id-key.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { useActionRunner } from "#native/action-runner/use-action-runner";
import { ResourceFormField } from "#native/resource-pages/resource-form-field";
import type { ResourceFormPageProps } from "#native/resource-pages/resource-form-page.props";
import { useRecord } from "#native/resource-pages/use-record";
import type { EditFormProps } from "#react/resource-pages/edit-form.props";
import type { ResourceFormProps } from "#react/resource-pages/resource-form.props";
import { useResourceForm } from "#react/resource-pages/use-resource-form";

/** The form over `action`'s input, started from `defaults`. */
function ResourceForm({ resource, action, defaults, recordId }: ResourceFormProps): ReactElement {
  const navigate = useNavigate();
  const { fields, saveLabel, serverErrors, submit } = useResourceForm({
    resource,
    action,
    defaults,
    recordId,
    run: useActionRunner(),
    // The saved record replaces the form, so Back returns to where the form was opened from.
    go: (page, id) => (id === undefined ? navigate.replace(page) : navigate.replace(page, { id })),
  });
  const form = useSchemaForm(action as unknown as abstract new () => Record<string, unknown>, {
    defaultValues: defaults,
    serverErrors,
  });
  return (
    <Form form={form} className="gap-4">
      {fields.map(({ key, ...field }) => (
        <ResourceFormField key={key} {...field} />
      ))}
      <Button
        isLoading={form.formState.isSubmitting}
        onPress={() => void form.handleSubmit(submit)()}
      >
        {saveLabel}
      </Button>
    </Form>
  );
}

/** The Edit form, once the record is read. */
function EditForm({ resource, action, id }: EditFormProps): ReactElement {
  const { t } = useTranslation();
  const { id: recordId, answer } = useRecord(resource, id);
  if (answer.isPending)
    return <PageSkeleton loadingLabel={t(resourceLabel(resource.key, "title"))} />;
  if (answer.error !== null || typeof answer.data !== "object" || answer.data === null)
    return <ErrorState {...answerFailureOf(answer, PANEL_KEYS.panel.resources, t)} />;
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
 * The native Create or Edit page of `resource`.
 *
 * @throws TypeError when the resource has no create (or update) action, or Edit has no id.
 * @example
 * <ResourceFormPage resource={Resources.Order} mode="edit" id={params.id} />
 */
export function ResourceFormPage({ resource, mode, id }: ResourceFormPageProps): ReactElement {
  const { t } = useTranslation();
  const action = formActionOf(resource, mode);
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4">
      <PageHeader
        title={t(resourceLabel(resource.key, "title"))}
        description={t(PANEL_KEYS.panel.resources[mode])}
      />
      {mode === "create" ? (
        <ResourceForm resource={resource} action={action} defaults={{}} />
      ) : (
        <EditForm resource={resource} action={action} id={id} />
      )}
    </ScrollView>
  );
}

/**
 * Stackra file contract:
 * Purpose: `ActionInputModal`, the modal form of a record action whose input needs more than the record id: the
 *          action's label as title, its declared confirm copy, one field per input key drawn by `ResourceFormField`,
 *          validated by the action's input schema with the record id pre-filled; submit runs the action once per
 *          record with the same values, and a refusal keeps the form open with the server's field errors and only the
 *          refused records left.
 * Boundary: internal to the resource pages. Registers the input schema under the action ref so `@stackra/ui`'s schema
 *           form reads it. The modal is the confirmation, so the runner skips its own dialog. Focus trap, focus return
 *           and Escape are the ui `Modal`'s (React Aria); Enter in a field submits the form.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 3); ADR 0139 (declared confirmation); ADR 0140 (refusals); ADR 0055.
 */
import { useTranslation } from "@stackra/i18n/react";
import { Button, Form, Modal, Text, useSchemaForm } from "@stackra/ui/react";
import { registerSchemas } from "@stackra/validation";
import { useState, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { resourceLabel } from "#core/functions/resource-label.function";
import { ActionRunStatus } from "#react/action-runner/action-run-status.enum";
import { useActionRunner } from "#react/action-runner/use-action-runner";
import type { ActionInputModalProps } from "#react/resource-pages/action-input-modal.props";
import { ResourceFormField } from "#react/resource-pages/resource-form-field";

/** The verb of an action key (`orders.order.cancel@1` is `cancel`). */
const verbOf = (key: string): string => key.replace(/@\d+$/, "").split(".").pop() ?? key;

/**
 * The modal form of `action` over `ids`.
 *
 * @example
 * <ActionInputModal resourceKey="reviews.review" action={ModerateReviewAction} idKey="reviewId" ids={["rev_1"]}
 *   keys={["decision", "note"]} onClose={close} />
 */
export function ActionInputModal({
  resourceKey,
  action,
  idKey,
  ids,
  keys,
  onClose,
}: ActionInputModalProps): ReactElement {
  const { t } = useTranslation();
  const run = useActionRunner();
  const [left, setLeft] = useState(ids);
  const [serverErrors, setServerErrors] = useState<Readonly<Record<string, string>>>({});
  // The ref's input is its schema; the schema form reads schemas by class, so record it under the ref.
  useState(() => registerSchemas([[action, action.input]]));
  const form = useSchemaForm(action as unknown as abstract new () => Record<string, unknown>, {
    // The id field is not drawn; it is filled so the schema validates, and replaced per record on submit.
    defaultValues: { [idKey]: ids[0] },
    serverErrors,
  });
  const ask = action.texts.confirm;
  const submit = async (values: Readonly<Record<string, unknown>>) => {
    const refused: string[] = [];
    let errors: Readonly<Record<string, string>> = {};
    // A bulk run fans out per record, so the policy decides each one (ADR 0307 rule 3).
    for (const id of left) {
      const done = await run(action, { ...values, [idKey]: id } as never, { confirmed: true });
      if (done.status === ActionRunStatus.Refused) {
        refused.push(id);
        errors = done.error.fieldErrors ?? errors;
      }
    }
    if (refused.length === 0) return onClose();
    setLeft(refused);
    setServerErrors(errors);
  };
  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Form form={form} submit={submit} className="contents">
        <Modal.Header>
          <Modal.Title>{t(resourceLabel(resourceKey, "actions", verbOf(action.key)))}</Modal.Title>
          {ask === undefined ? null : <Text>{t(typeof ask === "object" ? ask.text : ask)}</Text>}
        </Modal.Header>
        <Modal.Body>
          {keys.map((key) => (
            <ResourceFormField
              key={key}
              resourceKey={resourceKey}
              schema={action.input}
              node={{ kind: "value", key }}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button slot="close" variant="secondary">
            {t(PANEL_KEYS.panel.actions.cancel)}
          </Button>
          <Button type="submit" isLoading={form.formState.isSubmitting}>
            {t(PANEL_KEYS.panel.actions.confirm)}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

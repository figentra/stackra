/**
 * Stackra file contract:
 * Purpose: the native `ActionInputModal`, the modal form of an action whose input has fields besides the record id, as
 *          on the web: the action's label as title, its declared confirm copy, one field per input key drawn by the
 *          native `ResourceFormField`, validated by the action's input schema, the record id and the record's own values
 *          for those keys pre-filled; Confirm runs the action once per record (or once without one) with the same
 *          values, and a refusal keeps the form open with the server's field errors and only the refused records left.
 * Boundary: registers the input schema under the action ref so `@stackra/ui`'s schema form reads it. The modal is the
 *           confirmation, so the runner skips its own dialog. A phone has no submit key: Confirm validates and sends.
 *           Closed, it draws nothing, so each opening starts a fresh form. The dialog, its focus and the Android back
 *           button are the ui `Modal`'s.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rule 3); ADR 0139 (declared confirmation); ADR 0140 (refusals); ADR 0055; ADR 0164.
 */
import { useTranslation } from "@stackra/i18n/react";
import { Button, Form, Modal, Text, useSchemaForm } from "@stackra/ui/native";
import { registerSchemas } from "@stackra/validation";
import { useState, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { actionFormKeys } from "#core/functions/action-form-keys.function";
import { actionLabelKey } from "#core/functions/action-label-key.function";
import { valueAt } from "#core/functions/value-at.function";
import { useActionRunner } from "#native/action-runner/use-action-runner";
import type { ActionInputModalProps } from "#native/resource-pages/action-input-modal.props";
import { ResourceFormField } from "#native/resource-pages/resource-form-field";
import { ActionRunStatus } from "#react/action-runner/action-run-status.enum";

/** No bound inputs; one stable object, so a default prop does not change every render. */
const NOTHING_BOUND: Readonly<Record<string, unknown>> = Object.freeze({});

/** The open modal; mounted per opening so its records and errors start afresh. */
function OpenModal({
  resourceKey,
  action,
  idKey,
  ids,
  record,
  bound,
  keys,
  close,
}: Required<Pick<ActionInputModalProps, "resourceKey" | "action">> &
  Pick<ActionInputModalProps, "idKey" | "ids" | "record"> & {
    readonly bound: Readonly<Record<string, unknown>>;
    readonly keys: readonly string[];
    readonly close: () => void;
  }): ReactElement {
  const { t } = useTranslation();
  const run = useActionRunner();
  // An action without a record runs once, with no id.
  const [left, setLeft] = useState<readonly (string | undefined)[]>(
    idKey === undefined || ids === undefined ? [undefined] : ids,
  );
  const [serverErrors, setServerErrors] = useState<Readonly<Record<string, string>>>({});
  // The ref's input is its schema; the schema form reads schemas by class, so record it under the ref.
  useState(() => registerSchemas([[action, action.input]]));
  // A key the record holds starts from its value (a drafted reply), so staff confirm rather than retype it.
  const prefill = Object.fromEntries(
    keys.flatMap((key) => {
      const value = record === undefined ? undefined : valueAt(record, key);
      return value === undefined || value === null ? [] : [[key, value]];
    }),
  );
  const form = useSchemaForm(action as unknown as abstract new () => Record<string, unknown>, {
    // The id field is not drawn; it is filled so the schema validates, and replaced per record on submit.
    defaultValues:
      idKey === undefined || ids?.[0] === undefined
        ? { ...bound, ...prefill }
        : { ...bound, ...prefill, [idKey]: ids[0] },
    serverErrors,
  });
  const ask = action.texts.confirm;
  const submit = async (values: Readonly<Record<string, unknown>>) => {
    const refused: (string | undefined)[] = [];
    let errors: Readonly<Record<string, string>> = {};
    // A bulk run fans out per record, so the policy decides each one (ADR 0307 rule 3).
    for (const id of left) {
      const filled = { ...values, ...bound };
      const input = idKey === undefined || id === undefined ? filled : { ...filled, [idKey]: id };
      const done = await run(action, input as never, { confirmed: true });
      if (done.status === ActionRunStatus.Refused) {
        refused.push(id);
        errors = done.error.fieldErrors ?? errors;
      }
    }
    if (refused.length === 0) return close();
    setLeft(refused);
    setServerErrors(errors);
  };
  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Form form={form} className="gap-4">
        <Modal.Header>
          <Modal.Title>{t(actionLabelKey(resourceKey, action.key))}</Modal.Title>
          {ask === undefined ? null : <Text>{t(typeof ask === "object" ? ask.text : ask)}</Text>}
        </Modal.Header>
        <Modal.Body>
          {keys.map((key) => (
            <ResourceFormField
              key={key}
              resourceKey={resourceKey}
              schema={action.input}
              enumOwner={action.key.slice(0, action.key.lastIndexOf("."))}
              record={record}
              node={{ kind: "value", key }}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onPress={close}>
            {t(PANEL_KEYS.panel.actions.cancel)}
          </Button>
          <Button
            isLoading={form.formState.isSubmitting}
            onPress={() => void form.handleSubmit(submit)()}
          >
            {t(PANEL_KEYS.panel.actions.confirm)}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

/**
 * The modal form of `action` over `ids`, or run once without a record when `idKey` is absent.
 *
 * @example
 * <ActionInputModal resourceKey="reviews.review" action={ModerateReviewAction} idKey="reviewId" ids={["rev_1"]}
 *   isOpen={isOpen} onOpenChange={setOpen} />
 */
export function ActionInputModal({
  action,
  resourceKey,
  isOpen = true,
  onOpenChange,
  idKey,
  ids,
  record,
  bound = NOTHING_BOUND,
  keys,
}: ActionInputModalProps): ReactElement | null {
  if (!isOpen) return null;
  return (
    <OpenModal
      resourceKey={resourceKey}
      action={action}
      idKey={idKey}
      ids={ids}
      record={record}
      bound={bound}
      keys={keys ?? actionFormKeys(action.input, idKey).filter((key) => !Object.hasOwn(bound, key))}
      close={() => onOpenChange?.(false)}
    />
  );
}

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
import type { ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { actionFormKeys } from "#core/functions/action-form-keys.function";
import { actionLabelKey } from "#core/functions/action-label-key.function";
import { useActionRunner } from "#native/action-runner/use-action-runner";
import type { ActionInputModalProps } from "#native/resource-pages/action-input-modal.props";
import { ResourceFormField } from "#native/resource-pages/resource-form-field";
import { useActionInput } from "#react/resource-pages/use-action-input";

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
  const { defaultValues, serverErrors, submit } = useActionInput({
    action,
    idKey,
    ids,
    record,
    bound,
    keys,
    run: useActionRunner(),
    close,
  });
  const form = useSchemaForm(action as unknown as abstract new () => Record<string, unknown>, {
    defaultValues,
    serverErrors,
  });
  const ask = action.texts.confirm;
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

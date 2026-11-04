/**
 * Stackra file contract:
 * Purpose: `ActionInputModal`, the modal form of an action whose input has fields besides the record id: the action's
 *          label as title, its declared confirm copy, one field per input key drawn by `ResourceFormField`, validated by
 *          the action's input schema, the record id and the record's own values for those keys pre-filled; submit runs
 *          the action once per record (or once without one) with the same values, and a refusal keeps the form open
 *          with the server's field errors and only the refused records left.
 * Boundary: internal to the resource pages. Registers the input schema under the action ref so `@stackra/ui`'s schema
 *           form reads it. The modal is the confirmation, so the runner skips its own dialog. Focus trap, focus return
 *           and Escape are the ui `Modal`'s (React Aria); Enter in a field submits the form.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 3); ADR 0139 (declared confirmation); ADR 0140 (refusals); ADR 0055.
 */
import { Button, Form, Modal, Text, useSchemaForm } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { useActionRunner } from "#react/action-runner/use-action-runner";
import type { ActionInputModalProps } from "#react/resource-pages/action-input-modal.props";
import { ResourceFormField } from "#react/resource-pages/resource-form-field";
import { useActionInput } from "#react/resource-pages/use-action-input";

/** No bound inputs; one stable object, so a default prop does not change every render. */
const NOTHING_BOUND: Readonly<Record<string, unknown>> = Object.freeze({});

/**
 * The modal form of `action` over `ids`, or run once without a record when `idKey` is absent.
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
  record,
  bound = NOTHING_BOUND,
  keys,
  onClose,
}: ActionInputModalProps): ReactElement {
  const { words, fields, defaultValues, serverErrors, submit } = useActionInput({
    resourceKey,
    action,
    idKey,
    ids,
    record,
    bound,
    keys,
    run: useActionRunner(),
    close: onClose,
  });
  const form = useSchemaForm(action as unknown as abstract new () => Record<string, unknown>, {
    defaultValues,
    serverErrors,
  });
  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Form form={form} submit={submit} className="contents">
        <Modal.Header>
          <Modal.Title>{words.title}</Modal.Title>
          {words.confirmText === undefined ? null : <Text>{words.confirmText}</Text>}
        </Modal.Header>
        <Modal.Body>
          {fields.map(({ key, ...field }) => (
            <ResourceFormField key={key} {...field} />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button slot="close" variant="secondary">
            {words.cancel}
          </Button>
          <Button type="submit" isLoading={form.formState.isSubmitting}>
            {words.confirm}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

/**
 * Stackra file contract:
 * Purpose: `useActionInput(options)`, the state of an action's modal form on either entry: its words (the action's
 *          label as title, its declared confirm copy, cancel and confirm), the props of each asked field, the server's
 *          field errors, the form's start values (the bound inputs, the record's own values for the asked keys and the
 *          first record id) and the submit that runs the action once per record (or once without one) and keeps only
 *          the refused records with their field errors.
 * Boundary: platform-free: imports `react` and no UI kit, so the web and native `ActionInputModal` draw the same state
 *           with their own kit. Registers the input schema under the action ref so `@stackra/ui`'s schema form reads
 *           it. The caller's runner runs each record with `confirmed`, since the modal is the confirmation.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3); ADR 0139 (declared confirmation); ADR 0140 (refusals); ADR 0164.
 */
import type { ActionRef } from "@stackra/clients";
import { useTranslation } from "@stackra/i18n/react";
import { registerSchemas } from "@stackra/validation";
import { useState } from "react";
import type { ZodType } from "zod";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { actionLabelKey } from "#core/functions/action-label-key.function";
import { valueAt } from "#core/functions/value-at.function";
import type { FieldNode } from "#core/types/field-node.type";
import { ActionRunStatus } from "#react/action-runner/action-run-status.enum";
import type { ActionRunner } from "#react/action-runner/action-runner.type";

/**
 * The modal form state of `action` over `ids`, or one run without a record when `idKey` is absent.
 *
 * @example
 * const modal = useActionInput({ resourceKey, action, keys, bound, run: useActionRunner(), close });
 */
export function useActionInput({
  resourceKey,
  action,
  idKey,
  ids,
  record,
  bound,
  keys,
  run,
  close,
}: {
  readonly resourceKey: string;
  readonly action: ActionRef;
  readonly idKey?: string | undefined;
  readonly ids?: readonly string[] | undefined;
  readonly record?: object | undefined;
  readonly bound: Readonly<Record<string, unknown>>;
  readonly keys: readonly string[];
  readonly run: ActionRunner;
  readonly close: () => void;
}): {
  readonly words: {
    readonly title: string;
    readonly confirmText: string | undefined;
    readonly cancel: string;
    readonly confirm: string;
  };
  readonly fields: readonly {
    readonly key: string;
    readonly resourceKey: string;
    readonly schema: ZodType;
    readonly enumOwner: string;
    readonly record: object | undefined;
    readonly node: FieldNode;
  }[];
  readonly defaultValues: Readonly<Record<string, unknown>>;
  readonly serverErrors: Readonly<Record<string, string>>;
  readonly submit: (values: Readonly<Record<string, unknown>>) => Promise<void>;
} {
  const { t } = useTranslation();
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
  const ask = action.texts.confirm;
  return {
    words: {
      title: t(actionLabelKey(resourceKey, action.key)),
      confirmText: ask === undefined ? undefined : t(typeof ask === "object" ? ask.text : ask),
      cancel: t(PANEL_KEYS.panel.actions.cancel),
      confirm: t(PANEL_KEYS.panel.actions.confirm),
    },
    fields: keys.map((key) => ({
      key,
      resourceKey,
      schema: action.input,
      enumOwner: action.key.slice(0, action.key.lastIndexOf(".")),
      record,
      node: { kind: "value", key },
    })),
    // The id field is not drawn; it is filled so the schema validates, and replaced per record on submit.
    defaultValues:
      idKey === undefined || ids?.[0] === undefined
        ? { ...bound, ...prefill }
        : { ...bound, ...prefill, [idKey]: ids[0] },
    serverErrors,
    submit,
  };
}

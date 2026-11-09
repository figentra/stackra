/**
 * Stackra file contract:
 * Purpose: `ChatFormPart`, the chat's form of an action's input: one field per top-level key of the action's JSON Schema
 *          input, prefilled with the turn's values, checked by that schema, and sent as the person's answer. Each field
 *          is drawn as a screen draws it (`ResourceFormField` over the schema made zod), with `fieldKindOf`'s chat
 *          refinements: long text as a text area, several codes as a multi-select, and an upload (`{ id: "upl_…" }`)
 *          through the host's `upload`.
 * Boundary: draws and checks only; the host fetches the schema (Tamo's `gateway.tool.input_schema@1`) and answers the
 *           turn in `onSubmit`, and the action validates the values again when it runs. While the schema loads it
 *           shows a skeleton; a missing or unreadable schema shows a line saying the form cannot be shown. A reference
 *           is entered as its public id until a picker can name the model's options query.
 * Runtime: browser
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0055 (thin field adapters); ADR 0507 (Ask Tamo);
 *                     Tamo spec generative-ui-tools-artifacts (G3)
 */
import { useTranslation } from "@stackra/i18n/react";
import { useSchemaField, useZodFormHandle } from "@stackra/ui/form";
import { Button, FileTrigger, Form, Skeleton, Text } from "@stackra/ui/react";
import { type ReactElement, useMemo, useState } from "react";
import { type ZodType, z } from "zod";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { fieldKindOf } from "#core/functions/field-kind-of.function";
import type { FieldNode } from "#core/types/field-node.type";
import type { ChatFormPartProps } from "#react/chat-form-part/chat-form-part.props";
import { ResourceFormField } from "#react/resource-pages/resource-form-field";

/** A JSON Schema node. */
type Node = Readonly<Record<string, unknown>>;

/** Whether `value` is a schema node. */
const isNode = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Nothing prefilled; one stable object, so a default prop does not change every render. */
const NOTHING: Readonly<Record<string, unknown>> = Object.freeze({});

/** `<module>.<model>` of an action key (`orders.order.create@1` → `orders.order`), whose enum labels the selects take. */
const resourceKeyOf = (actionKey: string): string =>
  actionKey.split("@")[0]?.split(".").slice(0, 2).join(".") ?? actionKey;

/** The schema made zod, or undefined when it is not an object schema zod can read. */
function zodOf(schema: unknown): ZodType | undefined {
  if (!isNode(schema) || !isNode(schema["properties"])) return undefined;
  try {
    return z.fromJSONSchema(schema as Parameters<typeof z.fromJSONSchema>[0]);
  } catch {
    // An unreadable schema draws no form; the action still refuses bad input when it runs.
    return undefined;
  }
}

/** Props of `UploadField`. */
interface UploadFieldProps {
  /** The input path. */
  readonly name: string;
  /** The field's label. */
  readonly label: string;
  /** The host's upload, if any. */
  readonly upload: ChatFormPartProps["upload"];
  /** Whether the form was sent. */
  readonly isDisabled: boolean;
}

/** An upload held as `{ id }`: the host uploads the picked file and the field keeps its upload id. */
function UploadField({ name, label, upload, isDisabled }: UploadFieldProps): ReactElement {
  const { t } = useTranslation();
  const field = useSchemaField<{ readonly id: string } | null | undefined>(name);
  const [state, setState] = useState<{
    readonly file?: string;
    readonly busy: boolean;
    readonly failed: boolean;
  }>({ busy: false, failed: false });
  const words = PANEL_KEYS.panel.chat_form;
  if (upload === undefined)
    return (
      <div className="grid gap-1">
        <Text>{label}</Text>
        <Text type="small" tone="muted">
          {t(words.no_upload)}
        </Text>
      </div>
    );
  const pick = async (file: File) => {
    setState({ file: file.name, busy: true, failed: false });
    try {
      const { id } = await upload(file);
      field.onChange?.({ id });
      setState({ file: file.name, busy: false, failed: false });
    } catch {
      // The host's upload failed; the field keeps its earlier value and says so.
      setState({ file: file.name, busy: false, failed: true });
    }
  };
  return (
    <div className="grid gap-1">
      <Text>{label}</Text>
      <FileTrigger
        isDisabled={isDisabled || state.busy}
        onSelect={(files) => {
          const [file] = files;
          if (file !== undefined) void pick(file);
        }}
      >
        {state.busy
          ? t(words.uploading, { name: state.file })
          : (state.file ?? (field.value?.id === undefined ? t(words.upload) : field.value.id))}
      </FileTrigger>
      {state.failed ? (
        <Text type="small" tone="danger">
          {t(words.upload_failed, { name: state.file })}
        </Text>
      ) : null}
      {field.errorMessage === undefined ? null : (
        <Text type="small" tone="danger">
          {field.errorMessage}
        </Text>
      )}
    </div>
  );
}

/** Props of `ChatForm`: the part's props with the schema read. */
interface ChatFormProps extends Omit<ChatFormPartProps, "schema"> {
  /** The JSON Schema input. */
  readonly json: Node;
  /** The same schema made zod. */
  readonly zod: ZodType;
}

/** The form itself, drawn once the schema is known so its defaults are the schema's. */
function ChatForm({
  actionKey,
  json,
  zod,
  values = NOTHING,
  labels,
  upload,
  onSubmit,
  isSent = false,
}: ChatFormProps): ReactElement {
  const { t } = useTranslation();
  const form = useZodFormHandle<Record<string, unknown>>(zod, { defaultValues: { ...values } });
  const [sent, setSent] = useState(false);
  const done = isSent || sent;
  const properties = json["properties"] as Node;
  const required = new Set(Array.isArray(json["required"]) ? json["required"] : []);
  const resourceKey = resourceKeyOf(actionKey);
  const words = PANEL_KEYS.panel.chat_form;
  return (
    <Form
      form={form}
      ai={false}
      className="grid gap-3"
      submit={async (checked) => {
        await onSubmit({ ...checked });
        setSent(true);
      }}
    >
      {Object.keys(properties).map((key) => {
        const property = properties[key];
        const title = isNode(property) ? property["title"] : undefined;
        const label = labels?.[key] ?? (typeof title === "string" ? title : key);
        const kind = fieldKindOf(json, key);
        if (kind.kind === "file")
          return (
            <UploadField key={key} name={key} label={label} upload={upload} isDisabled={done} />
          );
        // The chat's refinements pick a control; every other kind is inferred as a screen infers it.
        const node: FieldNode = {
          kind: "value",
          key,
          label,
          isRequired: required.has(key),
          isDisabled: done,
          ...(kind.kind === "longtext" ? { control: "textarea" as const } : {}),
          ...(kind.kind === "multi_enum"
            ? {
                control: "multi-select" as const,
                choices: kind.options.map((code) => ({ value: code, label: code })),
              }
            : {}),
        };
        return <ResourceFormField key={key} resourceKey={resourceKey} schema={zod} node={node} />;
      })}
      <div>
        <Button type="submit" isDisabled={done} isLoading={form.formState.isSubmitting}>
          {t(done ? words.sent : words.send)}
        </Button>
      </div>
    </Form>
  );
}

/**
 * An action's form in a chat turn, prefilled by the assistant and sent by the person.
 *
 * @example
 * <ChatFormPart actionKey={data.actionKey} schema={inputSchema.data?.schema} values={data.values}
 *   upload={uploadToMedia} onSubmit={(values) => options.onAnswer?.(data.id, values)} />
 */
export function ChatFormPart({ schema, ...rest }: ChatFormPartProps): ReactElement {
  const { t } = useTranslation();
  const zod = useMemo(() => zodOf(schema), [schema]);
  if (schema === undefined)
    return (
      <div
        className="grid gap-2"
        aria-busy="true"
        aria-label={t(PANEL_KEYS.panel.chat_form.loading)}
      >
        <Skeleton />
        <Skeleton />
      </div>
    );
  if (zod === undefined || !isNode(schema))
    return (
      <Text type="small" tone="muted">
        {t(PANEL_KEYS.panel.chat_form.unavailable)}
      </Text>
    );
  return <ChatForm {...rest} json={schema} zod={zod} />;
}

/**
 * Stackra file contract:
 * Purpose: `ChatFormPartProps`, the props of the chat's action form: the action key, its JSON Schema input as the
 *          product's tool table holds it, the prefilled values, the field labels, the host's upload and the send.
 * Boundary: props only. The schema comes from the host (Tamo's `gateway.tool.input_schema@1`), never from the model; the
 *           panel takes no dependency on @stackra/ai, so the host maps a `data-tamo-form` part onto these props.
 * Runtime: browser
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0507 (Ask Tamo); Tamo spec
 *                     generative-ui-tools-artifacts (G3)
 */

/** Props of `ChatFormPart`. */
export interface ChatFormPartProps {
  /** The key of the action the form fills (`orders.order.create@1`); its module and model name the enum labels. */
  readonly actionKey: string;

  /** The action's input as JSON Schema; `undefined` while the host loads it, `null` when it may not be shown. */
  readonly schema: unknown;

  /** The prefilled input, keyed by field; a key the schema lacks is dropped by the schema on send. */
  readonly values?: Readonly<Record<string, unknown>> | undefined;

  /** Each top-level field to its label (text or an i18n key); else the schema's `title`, else the field name. */
  readonly labels?: Readonly<Record<string, string>> | undefined;

  /** Uploads one file and returns its upload id (`upl_…`); left out, a file field says files cannot be added. */
  readonly upload?: ((file: File) => Promise<{ readonly id: string }>) | undefined;

  /** Called with the checked values when the person sends the form; the host answers the form's turn with them. */
  readonly onSubmit: (values: Record<string, unknown>) => void | Promise<void>;

  /** True once the form was answered (for example on a turn read back from history); the form is then read-only. */
  readonly isSent?: boolean | undefined;
}

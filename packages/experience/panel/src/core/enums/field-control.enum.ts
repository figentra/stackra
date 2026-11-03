/**
 * Stackra file contract:
 * Purpose: `FieldControl`, the control a form field draws when the spec names one instead of the control inferred from
 *          the input type (the SDUI `formFields` case's `control`).
 * Boundary: an enum (`Enum.of`) read by `FormFieldSpec.control` and the web form renderer; a code the renderer does not
 *           draw yet falls back to the inferred control.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: forms); ADR 0294 (decision 16: Enum); ADR 0504.
 */
import { Enum } from "@stackra/contracts";

/**
 * The controls a form field can be drawn with.
 *
 * @example
 * FormField.from("note", { control: FieldControl.TextArea });
 */
export const FieldControl = Enum.of({
  /** A one-line text field. */
  Text: "text",
  /** A multi-line text area. */
  TextArea: "textarea",
  /** A text field for an email address. */
  Email: "email",
  /** A masked text field. */
  Password: "password",
  /** A text field for a URL. */
  Url: "url",
  /** A number field with steppers. */
  Number: "number",
  /** An amount in minor units, entered in major units of its currency. */
  Money: "money",
  /** A single-choice select. */
  Select: "select",
  /** A multiple-choice select. */
  MultiSelect: "multi-select",
  /** A radio group. */
  Radio: "radio",
  /** An on and off switch. */
  Switch: "switch",
  /** A checkbox. */
  Checkbox: "checkbox",
  /** A calendar day. */
  Date: "date",
  /** Two calendar days. */
  DateRange: "date-range",
  /** A time of day. */
  Time: "time",
  /** A slider over a number range. */
  Slider: "slider",
  /** A searchable single choice. */
  ComboBox: "combo-box",
  /** A picker over another resource's records. */
  Entity: "entity",
  /** A file upload. */
  Upload: "upload",
  /** A list of item groups. */
  Repeater: "repeater",
  /** A setting row. */
  Setting: "setting",
});

/** One of the codes above. */
export type FieldControl = Enum.Value<typeof FieldControl>;

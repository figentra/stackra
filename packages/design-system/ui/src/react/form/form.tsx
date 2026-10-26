/**
 * Stackra file contract:
 * Purpose: the web `Form` on HeroUI v3's Form (React Aria): a `form` element that hands its server errors
 *          (`validationErrors`) to the HeroUI fields inside it, and, with `isSubmitOnModEnter`, submits on Cmd or
 *          Ctrl plus Enter and never on Enter alone in a text box; every HeroUI prop passes through. Given a schema
 *          form (`form={useSchemaForm(...)}`), it provides that form to the `Field.*` parts inside it, validates
 *          with React Aria's `aria` behaviour, and with `submit` posts the validated values there.
 * Boundary: the key handling is the only behaviour added. Enter still presses a button, follows a link and adds a line
 *          in a text area, so the keyboard stays usable; and Enter during text composition (Arabic, Japanese) is left
 *          to the input method. Submitting is `requestSubmit`, so validation and the `submit` event run as for a click.
 *          `submit` is any function that takes the values (a route's `useSubmit()`), typed structurally, so this
 *          package does not depend on `@stackra/navigation`; an `onSubmit` of the caller wins over it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0055 (forms); ADR 0303; WCAG 2.2 SC 2.1.1.
 */
import { Form as HeroForm } from "@heroui/react";
import type { KeyboardEvent, ReactElement } from "react";
import { type FieldValues, FormProvider, type UseFormReturn } from "react-hook-form";
import type { FormProps } from "#react/form/form.props";

/** The input types whose Enter key does something of its own (press, choose, open), so Enter must reach them. */
const ENTER_ACTS_ON_ITS_OWN = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/** Whether an event came from a box the user types a single line into. */
function isTextBox(target: EventTarget): boolean {
  return target instanceof HTMLInputElement && !ENTER_ACTS_ON_ITS_OWN.has(target.type);
}

/**
 * A form. Fields inside it read its `validationErrors`; `onSubmit` takes the submit event. Set `isSubmitOnModEnter`
 * for a long form that Cmd or Ctrl plus Enter sends.
 */
export function Form<T extends FieldValues = FieldValues>({
  isSubmitOnModEnter = false,
  onKeyDown,
  form,
  submit,
  ...rest
}: FormProps<T>): ReactElement {
  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    onKeyDown?.(event);
    if (!isSubmitOnModEnter || event.defaultPrevented) return;
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    } else if (isTextBox(event.target)) {
      event.preventDefault();
    }
  };
  // A spread, not an attribute: HeroUI's form type does not list `onKeyDown`, but React Aria spreads every DOM prop onto
  // the `form` element, so the handler arrives.
  const keyProps = { onKeyDown: handleKeyDown };
  if (form === undefined) return <HeroForm {...rest} {...keyProps} />;
  const onSubmit = rest.onSubmit ?? (submit === undefined ? undefined : form.handleSubmit(submit));
  return (
    // The handle is react-hook-form's form with two members widened; the provider passes `control` and the rest on.
    <FormProvider {...(form as unknown as UseFormReturn<FieldValues>)}>
      <HeroForm
        validationBehavior="aria"
        {...rest}
        {...keyProps}
        {...(onSubmit === undefined ? {} : { onSubmit })}
      />
    </FormProvider>
  );
}

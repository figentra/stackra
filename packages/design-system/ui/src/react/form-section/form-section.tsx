/**
 * Stackra file contract:
 * Purpose: the web `FormSection` on HeroUI v3's Fieldset: a titled group of related fields, drawn as a `fieldset` whose
 *          `legend` is the title, with an optional description tied to the group by `aria-describedby` and the fields
 *          in HeroUI's field group (the vertical rhythm between fields). Every other HeroUI fieldset prop (`disabled`,
 *          `className`, `id`) passes through.
 * Boundary: no styling of its own. A `fieldset` names its group for assistive technology, so the title is read before
 *           each field inside it; `disabled` on the fieldset disables every control inside it, and HeroUI forwards
 *           that to the React Aria fields so they look and act disabled too.
 *           Disabling a section draws its fields afresh (HeroUI wraps them in context providers), so an uncontrolled
 *           field loses what was typed: bind the fields to a form, which keeps the values.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0055 (forms); ADR 0303; WCAG 2.2
 *          SC 1.3.1.
 */
import { Fieldset } from "@heroui/react";
import { useId, type ReactElement } from "react";

import { Description } from "#react/description/description";
import type { FormSectionProps } from "#react/form-section/form-section.props";

/** A titled group of related fields. Without a description it is a `fieldset` and its `legend`, nothing more. */
export function FormSection({
  title,
  description,
  children,
  ...rest
}: FormSectionProps): ReactElement {
  const descriptionId = useId();
  return (
    <Fieldset aria-describedby={description == null ? undefined : descriptionId} {...rest}>
      <Fieldset.Legend>{title}</Fieldset.Legend>
      {description == null ? null : <Description id={descriptionId}>{description}</Description>}
      <Fieldset.Group>{children}</Fieldset.Group>
    </Fieldset>
  );
}

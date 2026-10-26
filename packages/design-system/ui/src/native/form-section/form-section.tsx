/**
 * Stackra file contract:
 * Purpose: the native `FormSection`, the adapted form of the web one: HeroUI Native has no fieldset, so it is a `View`
 *          with the `group` role and the title as its accessible name, holding a Heading for the title, an optional
 *          Description and the fields; every `View` prop passes through.
 * Boundary: built on the free `View`, Heading and Description only; the only styling is the gaps between its parts
 *           (`gap-1` title to description, `gap-4` to the fields), so the section reads like the web one. A title that
 *           is not a string names the group only through the heading inside it, so pass `accessibilityLabel` then.
 *           A web `disabled` has no native counterpart: each field takes its own `isDisabled`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0165 (HeroUI Native on native); ADR 0055 (forms);
 *          ADR 0303.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { Description } from "#native/description/description";
import { Heading } from "#native/heading/heading";
import type { FormSectionProps } from "#native/form-section/form-section.props";

/** A titled group of related fields, the native form of the web section. */
export function FormSection({
  title,
  description,
  children,
  className,
  ...rest
}: FormSectionProps): ReactElement {
  return (
    <View
      role="group"
      className={["gap-4", className].filter(Boolean).join(" ")}
      {...(typeof title === "string" ? { accessibilityLabel: title } : {})}
      {...rest}
    >
      <View className="gap-1">
        <Heading level={3} type="h5">
          {title}
        </Heading>
        {description == null ? null : <Description>{description}</Description>}
      </View>
      {children}
    </View>
  );
}

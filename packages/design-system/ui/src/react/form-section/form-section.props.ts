/**
 * Stackra file contract:
 * Purpose: `FormSectionProps`, the props of the web `FormSection` in `form-section.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); ADR 0055 (forms); ADR 0303; WCAG 2.2 SC 1.3.1.
 */
import type { FieldsetRootProps } from "@heroui/react";
import type { ComponentPropsWithoutRef } from "react";
import type { FormSectionContractProps } from "#contracts/types/form-section-contract-props.type";

/**
 * Props of the web FormSection: the shared contract plus HeroUI v3's own fieldset props, passed through. HeroUI's
 * `title` (the HTML tooltip attribute) is replaced by the contract's `title`, the legend.
 */
export type FormSectionProps = FormSectionContractProps &
  Omit<
    FieldsetRootProps<"fieldset"> &
      Omit<ComponentPropsWithoutRef<"fieldset">, keyof FieldsetRootProps<"fieldset">>,
    keyof FormSectionContractProps
  >;

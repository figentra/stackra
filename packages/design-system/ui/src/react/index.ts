/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/ui, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Avatar, type AvatarProps } from "#react/avatar/avatar";
export { Badge, type BadgeAnchorProps, type BadgeProps } from "#react/badge/badge";
export { Button, type ButtonProps } from "#react/button/button";
export { Card, type CardProps } from "#react/card/card";
export type { CardTitleProps } from "#react/card/card-title";
export { CheckboxGroup, type CheckboxGroupProps } from "#react/checkbox-group/checkbox-group";
export { Checkbox, type CheckboxProps } from "#react/checkbox/checkbox";
export { Chip, type ChipProps } from "#react/chip/chip";
export { CloseButton, type CloseButtonProps } from "#react/close-button/close-button";
export { ComboBox, type ComboBoxProps } from "#react/combo-box/combo-box";
export { Description, type DescriptionProps } from "#react/description/description";
export { DesignSystemProvider } from "#react/design-system-provider/design-system-provider";
export { useDesignSystem } from "#react/design-system-provider/use-design-system";
export { FieldError, type FieldErrorProps } from "#react/field-error/field-error";
export { FormField, type FormFieldProps } from "#react/form-field/form-field";
export { FormSection, type FormSectionProps } from "#react/form-section/form-section";
export { Form, type FormProps } from "#react/form/form";
export { Heading, type HeadingProps } from "#react/heading/heading";
export { IconButton, type IconButtonProps } from "#react/icon-button/icon-button";
export { Icon, type IconProps } from "#react/icon/icon";
export { InputGroup, type InputGroupProps } from "#react/input-group/input-group";
export { Label, type LabelProps } from "#react/label/label";
export { Link, type LinkProps } from "#react/link/link";
export { RadioGroup, type RadioGroupProps } from "#react/radio-group/radio-group";
export { SearchField, type SearchFieldProps } from "#react/search-field/search-field";
export { Select, type SelectProps } from "#react/select/select";
export { Separator, type SeparatorProps } from "#react/separator/separator";
export { SkeletonGroup, type SkeletonGroupProps } from "#react/skeleton-group/skeleton-group";
export { Skeleton, type SkeletonProps } from "#react/skeleton/skeleton";
export { Spinner, type SpinnerProps } from "#react/spinner/spinner";
export { StatusBadge, type StatusBadgeProps } from "#react/status-badge/status-badge";
export { Surface, type SurfaceProps } from "#react/surface/surface";
export { Switch, type SwitchProps } from "#react/switch/switch";
export { TagGroup, type TagGroupProps } from "#react/tag-group/tag-group";
export { TextArea, type TextAreaProps } from "#react/text-area/text-area";
export { TextField, type TextFieldProps } from "#react/text-field/text-field";
export { Text, type TextProps } from "#react/text/text";
// The one router seam of the web kit: React Aria's own provider, re-exported so apps import UI only from here.
export { RouterProvider } from "react-aria-components";
// Web-only HeroUI components with nothing to unify with native, so they keep HeroUI's own API (ADR 0303 decision 6).
export { ToggleButton, ToggleButtonGroup, Toolbar } from "@heroui/react";

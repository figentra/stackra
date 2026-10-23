---
"@stackra/ui": minor
---

Add the wave 3 fields to `./react` (HeroUI v3) and `./native` (HeroUI Native): `TextField`, `TextArea`, `InputGroup`,
`SearchField`, `Select`, `ComboBox`, `TagGroup`, `Checkbox`, `CheckboxGroup`, `RadioGroup`, `Switch`, `Label`,
`Description`, `FieldError`, `Form`, `FormField` and `FormSection`, with their contract props and `FieldContractProps`,
`ChoiceOption`, `SelectItem`, `TagItem` and `FormFieldBinding` in `./contracts`. Every field takes one props API on both
runtimes: `label`, `description`, `errorMessage`, `isRequired`, `isInvalid`, `isDisabled`, `isReadOnly`, `value`,
`defaultValue`, `onChange(value)` and `name`; the list fields take `items` or `options`. `FormField` binds a field to
react-hook-form, which is now a required peer dependency of `@stackra/ui` because both `./react` and `./native` export
`FormField`. The native `DesignSystemProvider` now also sets React Native's `Appearance` and lays its subtree out in a
`flex: 1` View with the Yoga direction.

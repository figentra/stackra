# src/native

The `./native` entry of @stackra/ui (ADR 0294 decision 15): React Native renderers, one folder each,
`native/<name>/<name>.tsx` with its `__tests__/`. It imports `core/`, never `node/` or `react/`. Its optional peers are
`heroui-native`, `uniwind`, `lucide-react-native` and `react-native`, plus `expo-glass-effect` and `expo-blur` for the
buttons' glass.

`glass/` holds the native glass of the quiet buttons (ADR 0319): `useGlassMaterial()` picks Liquid Glass where the
platform runs it, else a blur under the theme's `surface` at the regular fill share, and solid while reduced
transparency, darker system colours or high text contrast is on; `useGlassButton(variant)` hands HeroUI Native's
`background` that layer for secondary, tertiary and outline. Button and CloseButton use it, and IconButton follows
through Button.

`./native` names the stand-in barrel `index.ts` (`DesignSystemProvider`, `useDesignSystem`, `Icon`, `Text`,
`Heading`, `Button`, `IconButton`, `CloseButton`, `Link`, `Surface`, `Card`, `Separator`, `Chip`, `StatusBadge`, `Badge`, `Avatar`, `Spinner`, `Skeleton`, `SkeletonGroup`, `Checkbox`, `CheckboxGroup`, `ComboBox`, `Description`, `FieldError`, `Form`, `FormField`, `FormSection`, `InputGroup`, `Label`, `RadioGroup`, `SearchField`, `Select`, `Switch`, `TagGroup`, `TextArea`, `TextField`, `Modal`, `Drawer`, `AlertDialog`, `ConfirmationProvider`, `useConfirmation`, `LeaveConfirmation`, `Menu`, `ActionMenu`, `Popover`, `Tooltip`, `Alert`, `toast`, `ToastProvider`, `ProgressBar`, `ProgressCircle`, `Table`, `List`, `ListItem`, `PropertyList`, `Tabs`, `Accordion`, `CursorPagination`, `Breadcrumbs`, `EmptyState`, `ErrorState`, `PageSkeleton`, `RouterProvider`). `Badge` is the adapted form on HeroUI Native's `Chip` (HeroUI Native has no badge), and `StatusBadge` the adapted form on our `Chip` until `stackra gen` writes the entry barrels (STA-339). The provider and `Icon` need the optional peer
`lucide-react-native`.

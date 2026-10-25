# src/native

The `./native` entry of @stackra/ui (ADR 0294 decision 15): React Native renderers, one folder each,
`native/<name>/<name>.tsx` with its `__tests__/`. It imports `core/`, never `node/` or `react/`. Its optional peers are
`heroui-native`, `uniwind`, `lucide-react-native` and `react-native`, plus `@internationalized/number` for `NumberField` and
`@expo/ui` and `@internationalized/date` for `DateField` and `DatePicker`.

`./native` names the stand-in barrel `index.ts` (`DesignSystemProvider`, `useDesignSystem`, `Icon`, `Text`,
`Heading`, `Button`, `IconButton`, `CloseButton`, `Link`, `Surface`, `Card`, `Separator`, `Chip`, `StatusBadge`, `Badge`, `Avatar`, `Spinner`, `Skeleton`, `SkeletonGroup`, `Checkbox`, `CheckboxGroup`, `ComboBox`, `Description`, `FieldError`, `Form`, `FormField`, `FormSection`, `InputGroup`, `Label`, `RadioGroup`, `SearchField`, `Select`, `Switch`, `TagGroup`, `TextArea`, `TextField`, `Modal`, `Drawer`, `AlertDialog`, `ConfirmationProvider`, `useConfirmation`, `LeaveConfirmation`, `Menu`, `ActionMenu`, `Popover`, `Tooltip`, `Alert`, `toast`, `ToastProvider`, `ProgressBar`, `ProgressCircle`, `Table`, `List`, `ListItem`, `PropertyList`, `Tabs`, `Accordion`, `CursorPagination`, `Breadcrumbs`, `EmptyState`, `ErrorState`, `PageSkeleton`, `AppShell`, `Sidebar`, `NavigationList`, `AppHeader`, `PageHeader`, `Section`, `SingleColumnLayout`, `TwoColumnLayout`, `Screen`, `NavigationHeader`, `TabBar`, `DataTable`, `BulkActionBar`, `FilterBar`, `EntityPicker`, `NumberField`, `DateField`, `DatePicker`, `RouterProvider`). `Badge` is the adapted form on HeroUI Native's `Chip` (HeroUI Native has no badge), and `StatusBadge` the adapted form on our `Chip` until `stackra gen` writes the entry barrels (STA-339). The provider and `Icon` need the optional peer
`lucide-react-native`.

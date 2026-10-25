# src/react

The `./react` entry of @stackra/ui (ADR 0294 decision 15): web renderers, one folder each,
`react/<name>/<name>.tsx` with its `__tests__/`. It imports `core/`, never `node/` or `native/`. Its optional peers are
`react-aria-components` and `@heroui/react`.

`./react` names the stand-in barrel `index.ts` (`DesignSystemProvider`, `useDesignSystem`, `Icon`, `Text`,
`Heading`, `Button`, `IconButton`, `CloseButton`, `Link`, `Surface`, `Card`, `Separator`, `Chip`, `StatusBadge`, `Badge`, `Avatar`, `Spinner`, `Skeleton`, `SkeletonGroup`, `Checkbox`, `CheckboxGroup`, `ComboBox`, `Description`, `FieldError`, `Form`, `FormField`, `FormSection`, `InputGroup`, `Label`, `RadioGroup`, `SearchField`, `Select`, `Switch`, `TagGroup`, `TextArea`, `TextField`, `Modal`, `Drawer`, `AlertDialog`, `ConfirmationProvider`, `useConfirmation`, `LeaveConfirmation`, `Menu`, `ActionMenu`, `Popover`, `Tooltip`, `Alert`, `toast`, `ToastProvider`, `ProgressBar`, `ProgressCircle`, `Table`, `List`, `ListItem`, `PropertyList`, `Tabs`, `Accordion`, `CursorPagination`, `Breadcrumbs`, `EmptyState`, `ErrorState`, `PageSkeleton`, `AppShell`, `Sidebar`, `NavigationList`, `AppHeader`, `PageHeader`, `Section`, `SingleColumnLayout`, `TwoColumnLayout`, `Screen`, `NavigationHeader`, the wave 7 `DataTable`, `BulkActionBar`, `FilterBar`, `EntityPicker`, `NumberField`,
`DateField` and `DatePicker`, and React Aria's `RouterProvider`) until `stackra gen` writes the entry barrels (STA-339). `Icon` and `Avatar` also need the optional peer `lucide-react`. `SkeletonGroup` is the adapted form: HeroUI v3 has none.

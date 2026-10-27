/**
 * Stackra file contract:
 * Purpose: the one list of the components the design-system review area shows: its category, its title, its route
 *          and its screen. The index screen renders the categories from it and the Settings stack registers the
 *          routes from it, so a component is added in one place.
 * Boundary: data only; the screens and the route names live elsewhere. The category is one of the owner's catalogue
 *          categories (`ComponentCategory`). Every row is a free `@stackra/ui/native` component (screens in `free/`,
 *          routes `Free*`): `@stackra-pro/ui` lives in figentra/stackra-pro (ADR 0461) and this app never imports it.
 *          The list is exported in gallery order (category, then title), the order the index lists the pages in and
 *          a page's pager walks them, so the order written below does not matter.
 * Runtime: react-native
 * Governing contract: ADR 0461 (decision 3); STA-403 FR-013.
 */

import { ComponentCategory } from "../enums/component-category.enum";
import { AccordionScreen } from "./free/accordion-screen";
import { ActionMenuScreen } from "./free/action-menu-screen";
import { AlertScreen } from "./free/alert-screen";
import { AlertDialogScreen } from "./free/alert-dialog-screen";
import { AvatarScreen } from "./free/avatar-screen";
import { BadgeScreen as FreeBadgeScreen } from "./free/badge-screen";
import { BreadcrumbsScreen } from "./free/breadcrumbs-screen";
import { BulkActionBarScreen } from "./free/bulk-action-bar-screen";
import { ButtonScreen } from "./free/button-screen";
import { CardScreen } from "./free/card-screen";
import { CheckboxScreen } from "./free/checkbox-screen";
import { CheckboxGroupScreen } from "./free/checkbox-group-screen";
import { ChipScreen } from "./free/chip-screen";
import { CloseButtonScreen } from "./free/close-button-screen";
import { ComboBoxScreen as FreeComboBoxScreen } from "./free/combo-box-screen";
import { DataTableScreen } from "./free/data-table-screen";
import { DateFieldScreen as FreeDateFieldScreen } from "./free/date-field-screen";
import { DatePickerScreen as FreeDatePickerScreen } from "./free/date-picker-screen";
import { DrawerScreen } from "./free/drawer-screen";
import { EmptyStateScreen as FreeEmptyStateScreen } from "./free/empty-state-screen";
import { EntityPickerScreen } from "./free/entity-picker-screen";
import { ErrorStateScreen } from "./free/error-state-screen";
import { FilterBarScreen } from "./free/filter-bar-screen";
import { FormScreen } from "./free/form-screen";
import { FormFieldScreen } from "./free/form-field-screen";
import { FormSectionScreen } from "./free/form-section-screen";
import { IconScreen } from "./free/icon-screen";
import { IconButtonScreen } from "./free/icon-button-screen";
import { InputGroupScreen } from "./free/input-group-screen";
import { LinkScreen } from "./free/link-screen";
import { ListScreen } from "./free/list-screen";
import { MenuScreen } from "./free/menu-screen";
import { ModalScreen } from "./free/modal-screen";
import { NavigationListScreen } from "./free/navigation-list-screen";
import { NumberFieldScreen as FreeNumberFieldScreen } from "./free/number-field-screen";
import { PageHeaderScreen } from "./free/page-header-screen";
import { PageSkeletonScreen } from "./free/page-skeleton-screen";
import { PopoverScreen } from "./free/popover-screen";
import { ProgressBarScreen as FreeProgressBarScreen } from "./free/progress-bar-screen";
import { ProgressCircleScreen as FreeProgressCircleScreen } from "./free/progress-circle-screen";
import { PropertyListScreen } from "./free/property-list-screen";
import { RadioGroupScreen } from "./free/radio-group-screen";
import { RevealScreen } from "./free/reveal-screen";
import { SearchFieldScreen } from "./free/search-field-screen";
import { SectionScreen } from "./free/section-screen";
import { SelectScreen } from "./free/select-screen";
import { SeparatorScreen } from "./free/separator-screen";
import { SkeletonScreen } from "./free/skeleton-screen";
import { SpinnerScreen } from "./free/spinner-screen";
import { StatusBadgeScreen } from "./free/status-badge-screen";
import { SurfaceScreen } from "./free/surface-screen";
import { SwitchScreen } from "./free/switch-screen";
import { TableScreen as FreeTableScreen } from "./free/table-screen";
import { TabsScreen } from "./free/tabs-screen";
import { TagGroupScreen } from "./free/tag-group-screen";
import { TextAreaScreen } from "./free/text-area-screen";
import { TextFieldScreen } from "./free/text-field-screen";
import { ToastScreen } from "./free/toast-screen";
import { TooltipScreen } from "./free/tooltip-screen";
import { TypographyScreen } from "./free/typography-screen";
import { UseConfirmationScreen } from "./free/use-confirmation-screen";
import { AiMarkScreen } from "./free/ai-mark-screen";
import { EnvironmentBannerScreen } from "./free/environment-banner-screen";
import { ModeSwitchScreen } from "./free/mode-switch-screen";
import type { DesignSystemComponent } from "../types/design-system-component.type";

/** The components as written, in no particular order. */
const COMPONENTS: readonly DesignSystemComponent[] = [
  {
    category: "AI",
    title: "AiMark",
    route: "FreeAiMark",
    screen: AiMarkScreen,
  },
  {
    category: "Feedback and status",
    title: "EnvironmentBanner",
    route: "FreeEnvironmentBanner",
    screen: EnvironmentBannerScreen,
  },
  {
    category: "Inputs and forms",
    title: "ModeSwitch",
    route: "FreeModeSwitch",
    screen: ModeSwitchScreen,
  },
  { category: "Foundations", title: "Icon", route: "FreeIcon", screen: IconScreen },
  {
    category: "Foundations",
    title: "Reveal",
    route: "FreeReveal",
    screen: RevealScreen,
  },
  {
    category: "Foundations",
    title: "Typography",
    route: "FreeTypography",
    screen: TypographyScreen,
  },
  { category: "Actions", title: "Button", route: "FreeButton", screen: ButtonScreen },
  {
    category: "Actions",
    title: "CloseButton",
    route: "FreeCloseButton",
    screen: CloseButtonScreen,
  },
  {
    category: "Actions",
    title: "IconButton",
    route: "FreeIconButton",
    screen: IconButtonScreen,
  },
  {
    category: "Inputs and forms",
    title: "Form",
    route: "FreeForm",
    screen: FormScreen,
  },
  {
    category: "Inputs and forms",
    title: "FormField",
    route: "FreeFormField",
    screen: FormFieldScreen,
  },
  {
    category: "Inputs and forms",
    title: "FormSection",
    route: "FreeFormSection",
    screen: FormSectionScreen,
  },
  {
    category: "Inputs and forms",
    title: "InputGroup",
    route: "FreeInputGroup",
    screen: InputGroupScreen,
  },
  {
    category: "Inputs and forms",
    title: "SearchField",
    route: "FreeSearchField",
    screen: SearchFieldScreen,
  },
  {
    category: "Inputs and forms",
    title: "TextArea",
    route: "FreeTextArea",
    screen: TextAreaScreen,
  },
  {
    category: "Inputs and forms",
    title: "TextField",
    route: "FreeTextField",
    screen: TextFieldScreen,
  },
  {
    category: "Selection",
    title: "Checkbox",
    route: "FreeCheckbox",
    screen: CheckboxScreen,
  },
  {
    category: "Selection",
    title: "CheckboxGroup",
    route: "FreeCheckboxGroup",
    screen: CheckboxGroupScreen,
  },
  {
    category: "Selection",
    title: "ComboBox",
    route: "FreeComboBox",
    screen: FreeComboBoxScreen,
  },
  {
    category: "Selection",
    title: "RadioGroup",
    route: "FreeRadioGroup",
    screen: RadioGroupScreen,
  },
  {
    category: "Selection",
    title: "Select",
    route: "FreeSelect",
    screen: SelectScreen,
  },
  {
    category: "Selection",
    title: "Switch",
    route: "FreeSwitch",
    screen: SwitchScreen,
  },
  {
    category: "Selection",
    title: "TagGroup",
    route: "FreeTagGroup",
    screen: TagGroupScreen,
  },
  {
    category: "Data display",
    title: "Avatar",
    route: "FreeAvatar",
    screen: AvatarScreen,
  },
  {
    category: "Data display",
    title: "Badge",
    route: "FreeBadge",
    screen: FreeBadgeScreen,
  },
  { category: "Data display", title: "Card", route: "FreeCard", screen: CardScreen },
  { category: "Data display", title: "Chip", route: "FreeChip", screen: ChipScreen },
  {
    category: "Feedback and status",
    title: "Skeleton",
    route: "FreeSkeleton",
    screen: SkeletonScreen,
  },
  {
    category: "Feedback and status",
    title: "Spinner",
    route: "FreeSpinner",
    screen: SpinnerScreen,
  },
  {
    category: "Feedback and status",
    title: "StatusBadge",
    route: "FreeStatusBadge",
    screen: StatusBadgeScreen,
  },
  { category: "Navigation", title: "Link", route: "FreeLink", screen: LinkScreen },
  {
    category: "Layout",
    title: "Separator",
    route: "FreeSeparator",
    screen: SeparatorScreen,
  },
  {
    category: "Layout",
    title: "Surface",
    route: "FreeSurface",
    screen: SurfaceScreen,
  },

  {
    category: "Inputs and forms",
    title: "NumberField",
    route: "FreeNumberField",
    screen: FreeNumberFieldScreen,
  },
  {
    category: "Selection",
    title: "EntityPicker",
    route: "FreeEntityPicker",
    screen: EntityPickerScreen,
  },
  {
    category: "Date and time",
    title: "DateField",
    route: "FreeDateField",
    screen: FreeDateFieldScreen,
  },
  {
    category: "Date and time",
    title: "DatePicker",
    route: "FreeDatePicker",
    screen: FreeDatePickerScreen,
  },
  {
    category: "Data display",
    title: "Accordion",
    route: "FreeAccordion",
    screen: AccordionScreen,
  },
  {
    category: "Data display",
    title: "BulkActionBar",
    route: "FreeBulkActionBar",
    screen: BulkActionBarScreen,
  },
  {
    category: "Data display",
    title: "DataTable",
    route: "FreeDataTable",
    screen: DataTableScreen,
  },
  {
    category: "Data display",
    title: "FilterBar",
    route: "FreeFilterBar",
    screen: FilterBarScreen,
  },
  {
    category: "Data display",
    title: "List",
    route: "FreeList",
    screen: ListScreen,
  },
  {
    category: "Data display",
    title: "PropertyList",
    route: "FreePropertyList",
    screen: PropertyListScreen,
  },
  {
    category: "Data display",
    title: "Table",
    route: "FreeTable",
    screen: FreeTableScreen,
  },
  {
    category: "Feedback and status",
    title: "Alert",
    route: "FreeAlert",
    screen: AlertScreen,
  },
  {
    category: "Feedback and status",
    title: "EmptyState",
    route: "FreeEmptyState",
    screen: FreeEmptyStateScreen,
  },
  {
    category: "Feedback and status",
    title: "ErrorState",
    route: "FreeErrorState",
    screen: ErrorStateScreen,
  },
  {
    category: "Feedback and status",
    title: "PageSkeleton",
    route: "FreePageSkeleton",
    screen: PageSkeletonScreen,
  },
  {
    category: "Feedback and status",
    title: "ProgressBar",
    route: "FreeProgressBar",
    screen: FreeProgressBarScreen,
  },
  {
    category: "Feedback and status",
    title: "ProgressCircle",
    route: "FreeProgressCircle",
    screen: FreeProgressCircleScreen,
  },
  {
    category: "Feedback and status",
    title: "Toast",
    route: "FreeToast",
    screen: ToastScreen,
  },
  {
    category: "Navigation",
    title: "Breadcrumbs",
    route: "FreeBreadcrumbs",
    screen: BreadcrumbsScreen,
  },
  {
    category: "Navigation",
    title: "NavigationList",
    route: "FreeNavigationList",
    screen: NavigationListScreen,
  },
  {
    category: "Navigation",
    title: "Tabs",
    route: "FreeTabs",
    screen: TabsScreen,
  },
  {
    category: "Overlays",
    title: "ActionMenu",
    route: "FreeActionMenu",
    screen: ActionMenuScreen,
  },
  {
    category: "Overlays",
    title: "AlertDialog",
    route: "FreeAlertDialog",
    screen: AlertDialogScreen,
  },
  {
    category: "Overlays",
    title: "Drawer",
    route: "FreeDrawer",
    screen: DrawerScreen,
  },
  {
    category: "Overlays",
    title: "Menu",
    route: "FreeMenu",
    screen: MenuScreen,
  },
  {
    category: "Overlays",
    title: "Modal",
    route: "FreeModal",
    screen: ModalScreen,
  },
  {
    category: "Overlays",
    title: "Popover",
    route: "FreePopover",
    screen: PopoverScreen,
  },
  {
    category: "Overlays",
    title: "Tooltip",
    route: "FreeTooltip",
    screen: TooltipScreen,
  },
  {
    category: "Overlays",
    title: "useConfirmation",
    route: "FreeUseConfirmation",
    screen: UseConfirmationScreen,
  },
  {
    category: "Layout",
    title: "PageHeader",
    route: "FreePageHeader",
    screen: PageHeaderScreen,
  },
  {
    category: "Layout",
    title: "Section",
    route: "FreeSection",
    screen: SectionScreen,
  },
];

/** The components of the review area in gallery order: by category, then by title. */
export const DESIGN_SYSTEM_COMPONENTS: readonly DesignSystemComponent[] = [...COMPONENTS].sort(
  (a, b) =>
    ComponentCategory.indexOf(a.category) - ComponentCategory.indexOf(b.category) ||
    a.title.localeCompare(b.title, "en"),
);

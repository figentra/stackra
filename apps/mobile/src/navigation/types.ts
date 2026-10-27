/**
 * Stackra file contract:
 * Purpose: `HomeStackParamList`, the Home stack's route names and params, and the global `ReactNavigation`
 *          augmentation from `RootStackParamList`; the other navigators' lists sit beside it, one per file.
 * Boundary: types only, plus the global augmentation; it declares no navigator.
 * Runtime: isomorphic
 * Governing contract: ADR 0007 (documentation).
 */
import type { RootStackParamList } from "./root-stack-param-list.type";

/**
 * The routes of the Home tab's stack and their params, declared once. A screen's `route.params` and every
 * `navigate()` are typed from here.
 */
export type HomeStackParamList = {
  /** The Home screen; takes no params. */
  Home: undefined;
  /** The design-system landing, the Home tab's root in development builds; deep link `stackra://design-system`. */
  DesignSystem: undefined;
  /** The free Accordion page; deep link `stackra://design-system/free/accordion`. */
  FreeAccordion: undefined;
  /** The free ActionMenu page; deep link `stackra://design-system/free/action-menu`. */
  FreeActionMenu: undefined;
  /** The free Alert page; deep link `stackra://design-system/free/alert`. */
  FreeAlert: undefined;
  /** The free AlertDialog page; deep link `stackra://design-system/free/alert-dialog`. */
  FreeAlertDialog: undefined;
  /** The free Avatar page; deep link `stackra://design-system/free/avatar`. */
  FreeAvatar: undefined;
  /** The free Badge page; deep link `stackra://design-system/free/badge`. */
  FreeBadge: undefined;
  /** The free Breadcrumbs page; deep link `stackra://design-system/free/breadcrumbs`. */
  FreeBreadcrumbs: undefined;
  /** The free BulkActionBar page; deep link `stackra://design-system/free/bulk-action-bar`. */
  FreeBulkActionBar: undefined;
  /** The free Button page; deep link `stackra://design-system/free/button`. */
  FreeButton: undefined;
  /** The free Card page; deep link `stackra://design-system/free/card`. */
  FreeCard: undefined;
  /** The free Checkbox page; deep link `stackra://design-system/free/checkbox`. */
  FreeCheckbox: undefined;
  /** The free CheckboxGroup page; deep link `stackra://design-system/free/checkbox-group`. */
  FreeCheckboxGroup: undefined;
  /** The free Chip page; deep link `stackra://design-system/free/chip`. */
  FreeChip: undefined;
  /** The free CloseButton page; deep link `stackra://design-system/free/close-button`. */
  FreeCloseButton: undefined;
  /** The free ComboBox page; deep link `stackra://design-system/free/combo-box`. */
  FreeComboBox: undefined;
  /** The free DataTable page; deep link `stackra://design-system/free/data-table`. */
  FreeDataTable: undefined;
  /** The free DateField page; deep link `stackra://design-system/free/date-field`. */
  FreeDateField: undefined;
  /** The free DatePicker page; deep link `stackra://design-system/free/date-picker`. */
  FreeDatePicker: undefined;
  /** The free Drawer page; deep link `stackra://design-system/free/drawer`. */
  FreeDrawer: undefined;
  /** The free EmptyState page; deep link `stackra://design-system/free/empty-state`. */
  FreeEmptyState: undefined;
  /** The free EntityPicker page; deep link `stackra://design-system/free/entity-picker`. */
  FreeEntityPicker: undefined;
  /** The free ErrorState page; deep link `stackra://design-system/free/error-state`. */
  FreeErrorState: undefined;
  /** The free FilterBar page; deep link `stackra://design-system/free/filter-bar`. */
  FreeFilterBar: undefined;
  /** The free Form page; deep link `stackra://design-system/free/form`. */
  FreeForm: undefined;
  /** The free FormField page; deep link `stackra://design-system/free/form-field`. */
  FreeFormField: undefined;
  /** The free FormSection page; deep link `stackra://design-system/free/form-section`. */
  FreeFormSection: undefined;
  /** The free Icon page; deep link `stackra://design-system/free/icon`. */
  FreeIcon: undefined;
  /** The free IconButton page; deep link `stackra://design-system/free/icon-button`. */
  FreeIconButton: undefined;
  /** The free InputGroup page; deep link `stackra://design-system/free/input-group`. */
  FreeInputGroup: undefined;
  /** The free Link page; deep link `stackra://design-system/free/link`. */
  FreeLink: undefined;
  /** The free List page; deep link `stackra://design-system/free/list`. */
  FreeList: undefined;
  /** The free Menu page; deep link `stackra://design-system/free/menu`. */
  FreeMenu: undefined;
  /** The free Modal page; deep link `stackra://design-system/free/modal`. */
  FreeModal: undefined;
  /** The free NavigationList page; deep link `stackra://design-system/free/navigation-list`. */
  FreeNavigationList: undefined;
  /** The free NumberField page; deep link `stackra://design-system/free/number-field`. */
  FreeNumberField: undefined;
  /** The free PageHeader page; deep link `stackra://design-system/free/page-header`. */
  FreePageHeader: undefined;
  /** The free PageSkeleton page; deep link `stackra://design-system/free/page-skeleton`. */
  FreePageSkeleton: undefined;
  /** The free Popover page; deep link `stackra://design-system/free/popover`. */
  FreePopover: undefined;
  /** The free ProgressBar page; deep link `stackra://design-system/free/progress-bar`. */
  FreeProgressBar: undefined;
  /** The free ProgressCircle page; deep link `stackra://design-system/free/progress-circle`. */
  FreeProgressCircle: undefined;
  /** The free PropertyList page; deep link `stackra://design-system/free/property-list`. */
  FreePropertyList: undefined;
  /** The free RadioGroup page; deep link `stackra://design-system/free/radio-group`. */
  FreeRadioGroup: undefined;
  /** The free Reveal page; deep link `stackra://design-system/free/reveal`. */
  FreeReveal: undefined;
  /** The free SearchField page; deep link `stackra://design-system/free/search-field`. */
  FreeSearchField: undefined;
  /** The free Section page; deep link `stackra://design-system/free/section`. */
  FreeSection: undefined;
  /** The free Select page; deep link `stackra://design-system/free/select`. */
  FreeSelect: undefined;
  /** The free Separator page; deep link `stackra://design-system/free/separator`. */
  FreeSeparator: undefined;
  /** The free Skeleton page; deep link `stackra://design-system/free/skeleton`. */
  FreeSkeleton: undefined;
  /** The free Spinner page; deep link `stackra://design-system/free/spinner`. */
  FreeSpinner: undefined;
  /** The free StatusBadge page; deep link `stackra://design-system/free/status-badge`. */
  FreeStatusBadge: undefined;
  /** The free Surface page; deep link `stackra://design-system/free/surface`. */
  FreeSurface: undefined;
  /** The free Switch page; deep link `stackra://design-system/free/switch`. */
  FreeSwitch: undefined;
  /** The free Table page; deep link `stackra://design-system/free/table`. */
  FreeTable: undefined;
  /** The free Tabs page; deep link `stackra://design-system/free/tabs`. */
  FreeTabs: undefined;
  /** The free TagGroup page; deep link `stackra://design-system/free/tag-group`. */
  FreeTagGroup: undefined;
  /** The free TextArea page; deep link `stackra://design-system/free/text-area`. */
  FreeTextArea: undefined;
  /** The free TextField page; deep link `stackra://design-system/free/text-field`. */
  FreeTextField: undefined;
  /** The free Toast page; deep link `stackra://design-system/free/toast`. */
  FreeToast: undefined;
  /** The free Tooltip page; deep link `stackra://design-system/free/tooltip`. */
  FreeTooltip: undefined;
  /** The free Typography page; deep link `stackra://design-system/free/typography`. */
  FreeTypography: undefined;
  /** The free useConfirmation page; deep link `stackra://design-system/free/use-confirmation`. */
  FreeUseConfirmation: undefined;
  /** The free AiMark page; deep link `stackra://design-system/free/ai-mark`. */
  FreeAiMark: undefined;
  /** The free EnvironmentBanner page; deep link `stackra://design-system/free/environment-banner`. */
  FreeEnvironmentBanner: undefined;
  /** The free ModeSwitch page; deep link `stackra://design-system/free/mode-switch`. */
  FreeModeSwitch: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

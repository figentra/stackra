/**
 * Stackra file contract:
 * Purpose: `COMPONENTS`, every registry entry in listing order (category, tier, slug). Metro has no glob, so
 *          the entry files are imported one by one.
 * Boundary: GENERATED from `src/registry/components/<tier>/<slug>.ts` and the module kits'
 *           `packages/<category>/<name>/showcase/<slug>.json` (gen-barrel, ADR 0504); do not edit by hand.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.
 */
import { FREE_ACCORDION } from "#src/registry/components/free/accordion";
import { FREE_ACCOUNT_CONNECTION } from "#src/registry/components/free/account-connection";
import { FREE_ACTION_MENU } from "#src/registry/components/free/action-menu";
import { FREE_ADDRESS_FIELD } from "#src/registry/components/free/address-field";
import { FREE_AI_MARK } from "#src/registry/components/free/ai-mark";
import { FREE_ALERT } from "#src/registry/components/free/alert";
import { FREE_ALERT_DIALOG } from "#src/registry/components/free/alert-dialog";
import { FREE_ANGLE_SLIDER } from "#src/registry/components/free/angle-slider";
import { FREE_APP_HEADER } from "#src/registry/components/free/app-header";
import { FREE_APP_SHELL } from "#src/registry/components/free/app-shell";
import { FREE_AREA_CHART } from "#src/registry/components/free/area-chart";
import { FREE_ASPECT_RATIO } from "#src/registry/components/free/aspect-ratio";
import { FREE_ATTACHMENT_CARD } from "#src/registry/components/free/attachment-card";
import { FREE_AVATAR } from "#src/registry/components/free/avatar";
import { FREE_AVATAR_GROUP } from "#src/registry/components/free/avatar-group";
import { FREE_BACK_TO_TOP } from "#src/registry/components/free/back-to-top";
import { FREE_BADGE } from "#src/registry/components/free/badge";
import { FREE_BARCODE } from "#src/registry/components/free/barcode";
import { FREE_BAR_CHART } from "#src/registry/components/free/bar-chart";
import { FREE_BAR_LIST } from "#src/registry/components/free/bar-list";
import { FREE_BIDI } from "#src/registry/components/free/bidi";
import { FREE_BOX_PLOT_CHART } from "#src/registry/components/free/box-plot-chart";
import { FREE_BREADCRUMBS } from "#src/registry/components/free/breadcrumbs";
import { FREE_BULK_ACTION_BAR } from "#src/registry/components/free/bulk-action-bar";
import { FREE_BULLET_CHART } from "#src/registry/components/free/bullet-chart";
import { FREE_BUTTON } from "#src/registry/components/free/button";
import { FREE_BUTTON_GROUP } from "#src/registry/components/free/button-group";
import { FREE_CALENDAR } from "#src/registry/components/free/calendar";
import { FREE_CALENDAR_HEATMAP } from "#src/registry/components/free/calendar-heatmap";
import { FREE_CANDLESTICK_CHART } from "#src/registry/components/free/candlestick-chart";
import { FREE_CARD } from "#src/registry/components/free/card";
import { FREE_CAROUSEL } from "#src/registry/components/free/carousel";
import { FREE_CASCADER } from "#src/registry/components/free/cascader";
import { FREE_CHART_EXPORT } from "#src/registry/components/free/chart-export";
import { FREE_CHART_LEGEND } from "#src/registry/components/free/chart-legend";
import { FREE_CHART_TOOLTIP } from "#src/registry/components/free/chart-tooltip";
import { FREE_CHAT_MESSAGE } from "#src/registry/components/free/chat-message";
import { FREE_CHECKBOX } from "#src/registry/components/free/checkbox";
import { FREE_CHECKBOX_BUTTON_GROUP } from "#src/registry/components/free/checkbox-button-group";
import { FREE_CHECKBOX_FIELD } from "#src/registry/components/free/checkbox-field";
import { FREE_CHECKBOX_GROUP } from "#src/registry/components/free/checkbox-group";
import { FREE_CHIP } from "#src/registry/components/free/chip";
import { FREE_CHORD_DIAGRAM } from "#src/registry/components/free/chord-diagram";
import { FREE_CHOROPLETH_MAP } from "#src/registry/components/free/choropleth-map";
import { FREE_CLOSE_BUTTON } from "#src/registry/components/free/close-button";
import { FREE_COACH_MARK } from "#src/registry/components/free/coach-mark";
import { FREE_CODE } from "#src/registry/components/free/code";
import { FREE_CODE_BLOCK } from "#src/registry/components/free/code-block";
import { FREE_COLLECTION_ENGINE } from "#src/registry/components/free/collection-engine";
import { FREE_COLOR_PICKER } from "#src/registry/components/free/color-picker";
import { FREE_COMBO_BOX } from "#src/registry/components/free/combo-box";
import { FREE_COMMAND_PALETTE } from "#src/registry/components/free/command-palette";
import { FREE_COMMENT_THREAD } from "#src/registry/components/free/comment-thread";
import { FREE_COMPOSED_CHART } from "#src/registry/components/free/composed-chart";
import { FREE_CONTEXTUAL_HELP } from "#src/registry/components/free/contextual-help";
import { FREE_CONTEXT_MENU } from "#src/registry/components/free/context-menu";
import { FREE_CONVERSATION_LIST } from "#src/registry/components/free/conversation-list";
import { FREE_COPY_BUTTON } from "#src/registry/components/free/copy-button";
import { FREE_COUNTDOWN } from "#src/registry/components/free/countdown";
import { FREE_COUNTRY_SELECT } from "#src/registry/components/free/country-select";
import { FREE_CURSOR_PAGINATION } from "#src/registry/components/free/cursor-pagination";
import { FREE_DASHBOARD_GRID } from "#src/registry/components/free/dashboard-grid";
import { FREE_DATA_GRID } from "#src/registry/components/free/data-grid";
import { FREE_DATA_TABLE } from "#src/registry/components/free/data-table";
import { FREE_DATA_VIEW } from "#src/registry/components/free/data-view";
import { FREE_DATE_FIELD } from "#src/registry/components/free/date-field";
import { FREE_DATE_LABEL } from "#src/registry/components/free/date-label";
import { FREE_DATE_PICKER } from "#src/registry/components/free/date-picker";
import { FREE_DATE_RANGE_PICKER } from "#src/registry/components/free/date-range-picker";
import { FREE_DATE_TIME_PICKER } from "#src/registry/components/free/date-time-picker";
import { FREE_DIFF_REVIEW } from "#src/registry/components/free/diff-review";
import { FREE_DISCLOSURE } from "#src/registry/components/free/disclosure";
import { FREE_DONUT_CHART } from "#src/registry/components/free/donut-chart";
import { FREE_DRAWER } from "#src/registry/components/free/drawer";
import { FREE_DROPDOWN } from "#src/registry/components/free/dropdown";
import { FREE_DROP_ZONE } from "#src/registry/components/free/drop-zone";
import { FREE_EMOJI_PICKER } from "#src/registry/components/free/emoji-picker";
import { FREE_EMPTY_STATE } from "#src/registry/components/free/empty-state";
import { FREE_ENTITY_PICKER } from "#src/registry/components/free/entity-picker";
import { FREE_ENVIRONMENT_BANNER } from "#src/registry/components/free/environment-banner";
import { FREE_ERROR_PAGE } from "#src/registry/components/free/error-page";
import { FREE_ERROR_STATE } from "#src/registry/components/free/error-state";
import { FREE_EXPORT_DIALOG } from "#src/registry/components/free/export-dialog";
import { FREE_FAB } from "#src/registry/components/free/fab";
import { FREE_FILE_TRIGGER } from "#src/registry/components/free/file-trigger";
import { FREE_FILTER_BAR } from "#src/registry/components/free/filter-bar";
import { FREE_FILTER_PANEL } from "#src/registry/components/free/filter-panel";
import { FREE_FLIP_CARD } from "#src/registry/components/free/flip-card";
import { FREE_FLOATING_PANEL } from "#src/registry/components/free/floating-panel";
import { FREE_FOOTER } from "#src/registry/components/free/footer";
import { FREE_FORM } from "#src/registry/components/free/form";
import { FREE_FORM_ERROR_SUMMARY } from "#src/registry/components/free/form-error-summary";
import { FREE_FORM_FIELD } from "#src/registry/components/free/form-field";
import { FREE_FORM_SECTION } from "#src/registry/components/free/form-section";
import { FREE_FOUNDATIONS } from "#src/registry/components/free/foundations";
import { FREE_FULLSCREEN_BAR } from "#src/registry/components/free/fullscreen-bar";
import { FREE_FUNNEL_CHART } from "#src/registry/components/free/funnel-chart";
import { FREE_GALLERY } from "#src/registry/components/free/gallery";
import { FREE_GAUGE_CHART } from "#src/registry/components/free/gauge-chart";
import { FREE_HEADING } from "#src/registry/components/free/heading";
import { FREE_HEATMAP_CHART } from "#src/registry/components/free/heatmap-chart";
import { FREE_HIGHLIGHT } from "#src/registry/components/free/highlight";
import { FREE_HISTOGRAM_CHART } from "#src/registry/components/free/histogram-chart";
import { FREE_HOLO_CARD } from "#src/registry/components/free/holo-card";
import { FREE_HOVER_CARD } from "#src/registry/components/free/hover-card";
import { FREE_ICON } from "#src/registry/components/free/icon";
import { FREE_ICON_BUTTON } from "#src/registry/components/free/icon-button";
import { FREE_IMAGE } from "#src/registry/components/free/image";
import { FREE_IMAGE_CROPPER } from "#src/registry/components/free/image-cropper";
import { FREE_IMPORT_DIALOG } from "#src/registry/components/free/import-dialog";
import { FREE_IMPORT_FLOW } from "#src/registry/components/free/import-flow";
import { FREE_INLINE_EDIT } from "#src/registry/components/free/inline-edit";
import { FREE_INLINE_LOADING } from "#src/registry/components/free/inline-loading";
import { FREE_INLINE_SELECT } from "#src/registry/components/free/inline-select";
import { FREE_INPUT_GROUP } from "#src/registry/components/free/input-group";
import { FREE_ITEM_CARD } from "#src/registry/components/free/item-card";
import { FREE_KIOSK_SURFACE } from "#src/registry/components/free/kiosk-surface";
import { FREE_KPI } from "#src/registry/components/free/kpi";
import { FREE_LAYOUT } from "#src/registry/components/free/layout";
import { FREE_LEAVE_CONFIRMATION } from "#src/registry/components/free/leave-confirmation";
import { FREE_LIGHTBOX } from "#src/registry/components/free/lightbox";
import { FREE_LINE_CHART } from "#src/registry/components/free/line-chart";
import { FREE_LINK } from "#src/registry/components/free/link";
import { FREE_LIST } from "#src/registry/components/free/list";
import { FREE_LISTBOX } from "#src/registry/components/free/listbox";
import { FREE_LOADING_OVERLAY } from "#src/registry/components/free/loading-overlay";
import { FREE_LOCALE_SWITCHER } from "#src/registry/components/free/locale-switcher";
import { FREE_MARQUEE } from "#src/registry/components/free/marquee";
import { FREE_MASKED_FIELD } from "#src/registry/components/free/masked-field";
import { FREE_MEDIA_PLAYER } from "#src/registry/components/free/media-player";
import { FREE_MENTION_INPUT } from "#src/registry/components/free/mention-input";
import { FREE_MENU } from "#src/registry/components/free/menu";
import { FREE_MENUBAR } from "#src/registry/components/free/menubar";
import { FREE_MESSAGE_ACTIONS } from "#src/registry/components/free/message-actions";
import { FREE_MESSAGE_SCROLLER } from "#src/registry/components/free/message-scroller";
import { FREE_METER } from "#src/registry/components/free/meter";
import { FREE_MODAL } from "#src/registry/components/free/modal";
import { FREE_MODEL_PICKER } from "#src/registry/components/free/model-picker";
import { FREE_MODE_SWITCH } from "#src/registry/components/free/mode-switch";
import { FREE_MONEY_FIELD } from "#src/registry/components/free/money-field";
import { FREE_MORPH_BUTTON } from "#src/registry/components/free/morph-button";
import { FREE_MORPH_TABS } from "#src/registry/components/free/morph-tabs";
import { FREE_MULTI_SELECT } from "#src/registry/components/free/multi-select";
import { FREE_NATIVE_SELECT } from "#src/registry/components/free/native-select";
import { FREE_NAVIGATION_HEADER } from "#src/registry/components/free/navigation-header";
import { FREE_NAVIGATION_LIST } from "#src/registry/components/free/navigation-list";
import { FREE_NAVIGATION_MENU } from "#src/registry/components/free/navigation-menu";
import { FREE_NETWORK_GRAPH } from "#src/registry/components/free/network-graph";
import { FREE_NOTIFICATIONS_PANEL } from "#src/registry/components/free/notifications-panel";
import { FREE_NUMBER_FIELD } from "#src/registry/components/free/number-field";
import { FREE_NUMBER_PAD } from "#src/registry/components/free/number-pad";
import { FREE_NUMBER_TICKER } from "#src/registry/components/free/number-ticker";
import { FREE_NUMBER_VALUE } from "#src/registry/components/free/number-value";
import { FREE_OTP_INPUT } from "#src/registry/components/free/otp-input";
import { FREE_OVERFLOW_LIST } from "#src/registry/components/free/overflow-list";
import { FREE_OVERFLOW_TOOLBAR } from "#src/registry/components/free/overflow-toolbar";
import { FREE_PAGE_HEADER } from "#src/registry/components/free/page-header";
import { FREE_PAGE_INDICATOR } from "#src/registry/components/free/page-indicator";
import { FREE_PAGE_SKELETON } from "#src/registry/components/free/page-skeleton";
import { FREE_PAGINATION } from "#src/registry/components/free/pagination";
import { FREE_PASSWORD_FIELD } from "#src/registry/components/free/password-field";
import { FREE_PERIOD_PICKER } from "#src/registry/components/free/period-picker";
import { FREE_PERMISSIONS_MATRIX } from "#src/registry/components/free/permissions-matrix";
import { FREE_PHONE_FIELD } from "#src/registry/components/free/phone-field";
import { FREE_PIE_CHART } from "#src/registry/components/free/pie-chart";
import { FREE_POLAR_CHART } from "#src/registry/components/free/polar-chart";
import { FREE_POPCONFIRM } from "#src/registry/components/free/popconfirm";
import { FREE_POPOVER } from "#src/registry/components/free/popover";
import { FREE_PRESS_FEEDBACK } from "#src/registry/components/free/press-feedback";
import { FREE_PROGRESS_BAR } from "#src/registry/components/free/progress-bar";
import { FREE_PROGRESS_BUTTON } from "#src/registry/components/free/progress-button";
import { FREE_PROGRESS_CIRCLE } from "#src/registry/components/free/progress-circle";
import { FREE_PROMPT_INPUT } from "#src/registry/components/free/prompt-input";
import { FREE_PROMPT_SUGGESTIONS } from "#src/registry/components/free/prompt-suggestions";
import { FREE_PROPERTY_LIST } from "#src/registry/components/free/property-list";
import { FREE_PULL_TO_REFRESH } from "#src/registry/components/free/pull-to-refresh";
import { FREE_QR_CODE } from "#src/registry/components/free/qr-code";
import { FREE_QUANTITY_STEPPER } from "#src/registry/components/free/quantity-stepper";
import { FREE_QUESTIONNAIRE_CARD } from "#src/registry/components/free/questionnaire-card";
import { FREE_RADAR_CHART } from "#src/registry/components/free/radar-chart";
import { FREE_RADIAL_BAR_CHART } from "#src/registry/components/free/radial-bar-chart";
import { FREE_RADIO_BUTTON_GROUP } from "#src/registry/components/free/radio-button-group";
import { FREE_RADIO_GROUP } from "#src/registry/components/free/radio-group";
import { FREE_RANGE_BAR_CHART } from "#src/registry/components/free/range-bar-chart";
import { FREE_RANGE_CALENDAR } from "#src/registry/components/free/range-calendar";
import { FREE_RANGE_SLIDER } from "#src/registry/components/free/range-slider";
import { FREE_RATING } from "#src/registry/components/free/rating";
import { FREE_REACTION_BUTTON } from "#src/registry/components/free/reaction-button";
import { FREE_REASONING } from "#src/registry/components/free/reasoning";
import { FREE_RECURRENCE_EDITOR } from "#src/registry/components/free/recurrence-editor";
import { FREE_RESULT } from "#src/registry/components/free/result";
import { FREE_REVEAL } from "#src/registry/components/free/reveal";
import { FREE_RICH_TEXT_EDITOR } from "#src/registry/components/free/rich-text-editor";
import { FREE_ROUTE_OVERLAY } from "#src/registry/components/free/route-overlay";
import { FREE_ROUTE_PROGRESS } from "#src/registry/components/free/route-progress";
import { FREE_RULE_BUILDER } from "#src/registry/components/free/rule-builder";
import { FREE_SANKEY_CHART } from "#src/registry/components/free/sankey-chart";
import { FREE_SAVE_BAR } from "#src/registry/components/free/save-bar";
import { FREE_SCATTER_CHART } from "#src/registry/components/free/scatter-chart";
import { FREE_SCHEDULER } from "#src/registry/components/free/scheduler";
import { FREE_SCREEN } from "#src/registry/components/free/screen";
import { FREE_SCROLL_AREA } from "#src/registry/components/free/scroll-area";
import { FREE_SEARCH_FIELD } from "#src/registry/components/free/search-field";
import { FREE_SECTION } from "#src/registry/components/free/section";
import { FREE_SEGMENTED_CONTROL } from "#src/registry/components/free/segmented-control";
import { FREE_SELECT } from "#src/registry/components/free/select";
import { FREE_SEPARATOR } from "#src/registry/components/free/separator";
import { FREE_SETTINGS_CELL } from "#src/registry/components/free/settings-cell";
import { FREE_SETTING_ROW } from "#src/registry/components/free/setting-row";
import { FREE_SETUP_GUIDE } from "#src/registry/components/free/setup-guide";
import { FREE_SHARE_BUTTON } from "#src/registry/components/free/share-button";
import { FREE_SHIMMER } from "#src/registry/components/free/shimmer";
import { FREE_SIDEBAR } from "#src/registry/components/free/sidebar";
import { FREE_SIDE_PANEL } from "#src/registry/components/free/side-panel";
import { FREE_SINGLE_COLUMN_LAYOUT } from "#src/registry/components/free/single-column-layout";
import { FREE_SKELETON } from "#src/registry/components/free/skeleton";
import { FREE_SLIDER } from "#src/registry/components/free/slider";
import { FREE_SLIDE_TO_CONFIRM } from "#src/registry/components/free/slide-to-confirm";
import { FREE_SOCIAL_SIGN_IN_BUTTONS } from "#src/registry/components/free/social-sign-in-buttons";
import { FREE_SORTABLE_LIST } from "#src/registry/components/free/sortable-list";
import { FREE_SOURCES } from "#src/registry/components/free/sources";
import { FREE_SPARKLINE } from "#src/registry/components/free/sparkline";
import { FREE_SPINNER } from "#src/registry/components/free/spinner";
import { FREE_SPLIT_BUTTON } from "#src/registry/components/free/split-button";
import { FREE_SPLIT_VIEW } from "#src/registry/components/free/split-view";
import { FREE_STACKED_METER } from "#src/registry/components/free/stacked-meter";
import { FREE_STATUS_BADGE } from "#src/registry/components/free/status-badge";
import { FREE_STATUS_INDICATOR } from "#src/registry/components/free/status-indicator";
import { FREE_STEPPER } from "#src/registry/components/free/stepper";
import { FREE_SUNBURST_CHART } from "#src/registry/components/free/sunburst-chart";
import { FREE_SURFACE } from "#src/registry/components/free/surface";
import { FREE_SWIPEABLE_ROW } from "#src/registry/components/free/swipeable-row";
import { FREE_SWIPEABLE_TABS } from "#src/registry/components/free/swipeable-tabs";
import { FREE_SWITCH } from "#src/registry/components/free/switch";
import { FREE_SYSTEM_BANNER } from "#src/registry/components/free/system-banner";
import { FREE_TABLE } from "#src/registry/components/free/table";
import { FREE_TABS } from "#src/registry/components/free/tabs";
import { FREE_TAB_BAR } from "#src/registry/components/free/tab-bar";
import { FREE_TAG_GROUP } from "#src/registry/components/free/tag-group";
import { FREE_TAG_INPUT } from "#src/registry/components/free/tag-input";
import { FREE_TASK_TRAY } from "#src/registry/components/free/task-tray";
import { FREE_TEXT_AREA } from "#src/registry/components/free/text-area";
import { FREE_TEXT_AREA_FIELD } from "#src/registry/components/free/text-area-field";
import { FREE_TEXT_FIELD } from "#src/registry/components/free/text-field";
import { FREE_TEXT_REVEAL } from "#src/registry/components/free/text-reveal";
import { FREE_THUMBNAIL } from "#src/registry/components/free/thumbnail";
import { FREE_TIMELINE } from "#src/registry/components/free/timeline";
import { FREE_TIMELINE_CHART } from "#src/registry/components/free/timeline-chart";
import { FREE_TIME_CLOCK } from "#src/registry/components/free/time-clock";
import { FREE_TIME_FIELD } from "#src/registry/components/free/time-field";
import { FREE_TIME_PICKER } from "#src/registry/components/free/time-picker";
import { FREE_TOAST } from "#src/registry/components/free/toast";
import { FREE_TOC_RAIL } from "#src/registry/components/free/toc-rail";
import { FREE_TOGGLE_BUTTON } from "#src/registry/components/free/toggle-button";
import { FREE_TOOLTIP } from "#src/registry/components/free/tooltip";
import { FREE_TRACKER_STRIP } from "#src/registry/components/free/tracker-strip";
import { FREE_TRANSFER_LIST } from "#src/registry/components/free/transfer-list";
import { FREE_TREEMAP_CHART } from "#src/registry/components/free/treemap-chart";
import { FREE_TREE_DIAGRAM } from "#src/registry/components/free/tree-diagram";
import { FREE_TREE_SELECT } from "#src/registry/components/free/tree-select";
import { FREE_TREE_VIEW } from "#src/registry/components/free/tree-view";
import { FREE_TRUNCATE } from "#src/registry/components/free/truncate";
import { FREE_TURNSTILE } from "#src/registry/components/free/turnstile";
import { FREE_TWO_COLUMN_LAYOUT } from "#src/registry/components/free/two-column-layout";
import { FREE_TYPOGRAPHY } from "#src/registry/components/free/typography";
import { FREE_USE_BREAKPOINT } from "#src/registry/components/free/use-breakpoint";
import { FREE_USE_CONFIRMATION } from "#src/registry/components/free/use-confirmation";
import { FREE_VIEW_STACK } from "#src/registry/components/free/view-stack";
import { FREE_VISUALLY_HIDDEN } from "#src/registry/components/free/visually-hidden";
import { FREE_VOICE_INPUT } from "#src/registry/components/free/voice-input";
import { FREE_WAFFLE_CHART } from "#src/registry/components/free/waffle-chart";
import { FREE_WATERFALL_CHART } from "#src/registry/components/free/waterfall-chart";
import { FREE_WHEEL_PICKER } from "#src/registry/components/free/wheel-picker";
import { FREE_WIDGET_FRAME } from "#src/registry/components/free/widget-frame";
import { FREE_WORD_CLOUD } from "#src/registry/components/free/word-cloud";
import { FREE_YEAR_PICKER } from "#src/registry/components/free/year-picker";
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Every component entry, in listing order. */
export const COMPONENTS: readonly ComponentEntry[] = Object.freeze([
  FREE_BIDI,
  FREE_CODE,
  FREE_COLLECTION_ENGINE,
  FREE_FOUNDATIONS,
  FREE_HEADING,
  FREE_ICON,
  FREE_PRESS_FEEDBACK,
  FREE_REVEAL,
  FREE_TEXT_REVEAL,
  FREE_TYPOGRAPHY,
  FREE_VISUALLY_HIDDEN,
  FREE_BUTTON,
  FREE_BUTTON_GROUP,
  FREE_CLOSE_BUTTON,
  FREE_COPY_BUTTON,
  FREE_FAB,
  FREE_ICON_BUTTON,
  FREE_MORPH_BUTTON,
  FREE_OVERFLOW_TOOLBAR,
  FREE_PROGRESS_BUTTON,
  FREE_REACTION_BUTTON,
  FREE_SHARE_BUTTON,
  FREE_SLIDE_TO_CONFIRM,
  FREE_SOCIAL_SIGN_IN_BUTTONS,
  FREE_SPLIT_BUTTON,
  FREE_ADDRESS_FIELD,
  FREE_ANGLE_SLIDER,
  FREE_CHECKBOX_FIELD,
  FREE_COLOR_PICKER,
  FREE_DROP_ZONE,
  FREE_FILE_TRIGGER,
  FREE_FORM,
  FREE_FORM_ERROR_SUMMARY,
  FREE_FORM_FIELD,
  FREE_FORM_SECTION,
  FREE_IMAGE_CROPPER,
  FREE_INLINE_EDIT,
  FREE_INPUT_GROUP,
  FREE_MASKED_FIELD,
  FREE_MENTION_INPUT,
  FREE_MODE_SWITCH,
  FREE_MONEY_FIELD,
  FREE_NUMBER_FIELD,
  FREE_NUMBER_PAD,
  FREE_OTP_INPUT,
  FREE_PASSWORD_FIELD,
  FREE_PHONE_FIELD,
  FREE_QUANTITY_STEPPER,
  FREE_RANGE_SLIDER,
  FREE_RATING,
  FREE_RICH_TEXT_EDITOR,
  FREE_RULE_BUILDER,
  FREE_SEARCH_FIELD,
  FREE_SETTING_ROW,
  FREE_SETTINGS_CELL,
  FREE_SLIDER,
  FREE_TAG_INPUT,
  FREE_TEXT_AREA,
  FREE_TEXT_AREA_FIELD,
  FREE_TEXT_FIELD,
  FREE_TURNSTILE,
  FREE_CASCADER,
  FREE_CHECKBOX,
  FREE_CHECKBOX_BUTTON_GROUP,
  FREE_CHECKBOX_GROUP,
  FREE_COMBO_BOX,
  FREE_COUNTRY_SELECT,
  FREE_EMOJI_PICKER,
  FREE_ENTITY_PICKER,
  FREE_INLINE_SELECT,
  FREE_LISTBOX,
  FREE_MULTI_SELECT,
  FREE_NATIVE_SELECT,
  FREE_RADIO_BUTTON_GROUP,
  FREE_RADIO_GROUP,
  FREE_SEGMENTED_CONTROL,
  FREE_SELECT,
  FREE_SWITCH,
  FREE_TAG_GROUP,
  FREE_TOGGLE_BUTTON,
  FREE_TRANSFER_LIST,
  FREE_TREE_SELECT,
  FREE_CALENDAR,
  FREE_COUNTDOWN,
  FREE_DATE_FIELD,
  FREE_DATE_LABEL,
  FREE_DATE_PICKER,
  FREE_DATE_RANGE_PICKER,
  FREE_DATE_TIME_PICKER,
  FREE_PERIOD_PICKER,
  FREE_RANGE_CALENDAR,
  FREE_RECURRENCE_EDITOR,
  FREE_SCHEDULER,
  FREE_TIME_CLOCK,
  FREE_TIME_FIELD,
  FREE_TIME_PICKER,
  FREE_WHEEL_PICKER,
  FREE_YEAR_PICKER,
  FREE_AREA_CHART,
  FREE_BAR_CHART,
  FREE_BAR_LIST,
  FREE_BOX_PLOT_CHART,
  FREE_BULLET_CHART,
  FREE_CALENDAR_HEATMAP,
  FREE_CANDLESTICK_CHART,
  FREE_CHART_EXPORT,
  FREE_CHART_LEGEND,
  FREE_CHART_TOOLTIP,
  FREE_CHORD_DIAGRAM,
  FREE_CHOROPLETH_MAP,
  FREE_COMPOSED_CHART,
  FREE_DONUT_CHART,
  FREE_FUNNEL_CHART,
  FREE_GAUGE_CHART,
  FREE_HEATMAP_CHART,
  FREE_HISTOGRAM_CHART,
  FREE_LINE_CHART,
  FREE_NETWORK_GRAPH,
  FREE_PIE_CHART,
  FREE_POLAR_CHART,
  FREE_RADAR_CHART,
  FREE_RADIAL_BAR_CHART,
  FREE_RANGE_BAR_CHART,
  FREE_SANKEY_CHART,
  FREE_SCATTER_CHART,
  FREE_SPARKLINE,
  FREE_SUNBURST_CHART,
  FREE_TIMELINE_CHART,
  FREE_TRACKER_STRIP,
  FREE_TREE_DIAGRAM,
  FREE_TREEMAP_CHART,
  FREE_WAFFLE_CHART,
  FREE_WATERFALL_CHART,
  FREE_WORD_CLOUD,
  FREE_ACCORDION,
  FREE_ACCOUNT_CONNECTION,
  FREE_ATTACHMENT_CARD,
  FREE_AVATAR,
  FREE_AVATAR_GROUP,
  FREE_BADGE,
  FREE_BARCODE,
  FREE_BULK_ACTION_BAR,
  FREE_CARD,
  FREE_CAROUSEL,
  FREE_CHIP,
  FREE_CODE_BLOCK,
  FREE_COMMENT_THREAD,
  FREE_DATA_GRID,
  FREE_DATA_TABLE,
  FREE_DATA_VIEW,
  FREE_DIFF_REVIEW,
  FREE_DISCLOSURE,
  FREE_EXPORT_DIALOG,
  FREE_FILTER_BAR,
  FREE_FILTER_PANEL,
  FREE_FLIP_CARD,
  FREE_GALLERY,
  FREE_HIGHLIGHT,
  FREE_HOLO_CARD,
  FREE_IMAGE,
  FREE_IMPORT_DIALOG,
  FREE_IMPORT_FLOW,
  FREE_ITEM_CARD,
  FREE_KPI,
  FREE_LIST,
  FREE_MARQUEE,
  FREE_MEDIA_PLAYER,
  FREE_NUMBER_TICKER,
  FREE_NUMBER_VALUE,
  FREE_OVERFLOW_LIST,
  FREE_PERMISSIONS_MATRIX,
  FREE_PROPERTY_LIST,
  FREE_QR_CODE,
  FREE_SORTABLE_LIST,
  FREE_STACKED_METER,
  FREE_SWIPEABLE_ROW,
  FREE_TABLE,
  FREE_THUMBNAIL,
  FREE_TIMELINE,
  FREE_TREE_VIEW,
  FREE_TRUNCATE,
  FREE_WIDGET_FRAME,
  FREE_ALERT,
  FREE_EMPTY_STATE,
  FREE_ENVIRONMENT_BANNER,
  FREE_ERROR_PAGE,
  FREE_ERROR_STATE,
  FREE_INLINE_LOADING,
  FREE_LOADING_OVERLAY,
  FREE_METER,
  FREE_NOTIFICATIONS_PANEL,
  FREE_PAGE_SKELETON,
  FREE_PROGRESS_BAR,
  FREE_PROGRESS_CIRCLE,
  FREE_PULL_TO_REFRESH,
  FREE_RESULT,
  FREE_ROUTE_PROGRESS,
  FREE_SAVE_BAR,
  FREE_SETUP_GUIDE,
  FREE_SKELETON,
  FREE_SPINNER,
  FREE_STATUS_BADGE,
  FREE_STATUS_INDICATOR,
  FREE_SYSTEM_BANNER,
  FREE_TASK_TRAY,
  FREE_TOAST,
  FREE_BACK_TO_TOP,
  FREE_BREADCRUMBS,
  FREE_CURSOR_PAGINATION,
  FREE_LINK,
  FREE_LOCALE_SWITCHER,
  FREE_MENUBAR,
  FREE_MORPH_TABS,
  FREE_NAVIGATION_HEADER,
  FREE_NAVIGATION_LIST,
  FREE_NAVIGATION_MENU,
  FREE_PAGE_INDICATOR,
  FREE_PAGINATION,
  FREE_SIDE_PANEL,
  FREE_SIDEBAR,
  FREE_STEPPER,
  FREE_SWIPEABLE_TABS,
  FREE_TAB_BAR,
  FREE_TABS,
  FREE_TOC_RAIL,
  FREE_VIEW_STACK,
  FREE_ACTION_MENU,
  FREE_ALERT_DIALOG,
  FREE_COACH_MARK,
  FREE_COMMAND_PALETTE,
  FREE_CONTEXT_MENU,
  FREE_CONTEXTUAL_HELP,
  FREE_DRAWER,
  FREE_DROPDOWN,
  FREE_FLOATING_PANEL,
  FREE_HOVER_CARD,
  FREE_LEAVE_CONFIRMATION,
  FREE_LIGHTBOX,
  FREE_MENU,
  FREE_MODAL,
  FREE_POPCONFIRM,
  FREE_POPOVER,
  FREE_ROUTE_OVERLAY,
  FREE_TOOLTIP,
  FREE_USE_CONFIRMATION,
  FREE_APP_HEADER,
  FREE_APP_SHELL,
  FREE_ASPECT_RATIO,
  FREE_DASHBOARD_GRID,
  FREE_FOOTER,
  FREE_FULLSCREEN_BAR,
  FREE_KIOSK_SURFACE,
  FREE_LAYOUT,
  FREE_PAGE_HEADER,
  FREE_SCREEN,
  FREE_SCROLL_AREA,
  FREE_SECTION,
  FREE_SEPARATOR,
  FREE_SINGLE_COLUMN_LAYOUT,
  FREE_SPLIT_VIEW,
  FREE_SURFACE,
  FREE_TWO_COLUMN_LAYOUT,
  FREE_USE_BREAKPOINT,
  // KIT_CART: @stackra/payments, from its showcase/cart.json
  {
    slug: "cart",
    tier: "free",
    category: "blocks",
    platforms: ["react"],
    packageName: "@stackra/payments",
    exportName: "Cart",
    parts: ["Cart"],
    hero: {},
    examples: [{ id: "basics", card: true, minHeight: 480 }],
    related: ["free/quantity-stepper", "free/thumbnail", "free/checkout"],
    tokens: ["color.surface", "color.separator"],
    keywords: ["cart", "basket", "bag", "shopping", "order", "kit"],
    status: "new",
  },
  // KIT_CHECKOUT: @stackra/payments, from its showcase/checkout.json
  {
    slug: "checkout",
    tier: "free",
    category: "blocks",
    platforms: ["react"],
    packageName: "@stackra/payments",
    exportName: "Checkout",
    parts: ["Checkout"],
    hero: {},
    examples: [{ id: "basics", card: true, minHeight: 760 }],
    related: ["free/cart", "free/radio-group", "free/address-field"],
    tokens: ["color.surface", "color.field"],
    keywords: ["checkout", "payment", "shipping", "order", "purchase", "kit"],
    status: "new",
  },
  // KIT_CTA_SECTION: @stackra/experience, from its showcase/cta-section.json
  {
    slug: "cta-section",
    tier: "free",
    category: "blocks",
    platforms: ["react"],
    packageName: "@stackra/experience",
    exportName: "CtaSection",
    parts: ["CtaSection"],
    hero: {},
    examples: [{ id: "basics", card: true, minHeight: 360 }],
    related: ["free/feature-section", "free/surface", "free/text-field"],
    tokens: ["color.surface", "color.accent"],
    keywords: ["call to action", "cta", "newsletter", "subscribe", "marketing", "kit"],
    status: "new",
  },
  // KIT_FEATURE_SECTION: @stackra/experience, from its showcase/feature-section.json
  {
    slug: "feature-section",
    tier: "free",
    category: "blocks",
    platforms: ["react"],
    packageName: "@stackra/experience",
    exportName: "FeatureSection",
    parts: ["FeatureSection"],
    hero: {},
    examples: [{ id: "basics", card: true, minHeight: 420 }],
    related: ["free/section", "free/icon", "free/cta-section"],
    tokens: ["color.accent-soft", "color.foreground"],
    keywords: ["features", "marketing", "landing", "section", "benefits", "kit"],
    status: "new",
  },
  // KIT_PRICING_TABLE: @stackra/pricing, from its showcase/pricing-table.json
  {
    slug: "pricing-table",
    tier: "free",
    category: "blocks",
    platforms: ["react"],
    packageName: "@stackra/pricing",
    exportName: "PricingTable",
    parts: ["PricingTable"],
    hero: {},
    examples: [{ id: "basics", card: true, minHeight: 560 }],
    related: ["free/segmented-control", "free/card", "free/cart"],
    tokens: ["color.surface", "color.accent"],
    keywords: ["pricing", "plans", "subscription", "billing", "monthly", "yearly", "kit"],
    status: "new",
  },
  // KIT_SIGN_IN: @stackra/identity, from its showcase/sign-in.json
  {
    slug: "sign-in",
    tier: "free",
    category: "blocks",
    platforms: ["react"],
    packageName: "@stackra/identity",
    exportName: "SignIn",
    parts: ["SignIn"],
    hero: {},
    examples: [{ id: "basics", card: true, minHeight: 560 }],
    related: ["free/social-sign-in-buttons", "free/password-field", "free/text-field"],
    tokens: ["color.surface", "color.field"],
    keywords: ["login", "sign in", "log in", "authentication", "password", "kit"],
    status: "new",
  },
  FREE_AI_MARK,
  FREE_CHAT_MESSAGE,
  // KIT_CHAT_SURFACE: @stackra/ai, from its showcase/chat-surface.json
  {
    slug: "chat-surface",
    tier: "free",
    category: "ai",
    platforms: ["react"],
    packageName: "@stackra/ai",
    exportName: "ChatSurface",
    parts: ["ChatSurface"],
    hero: {},
    examples: [{ id: "basics", card: true, minHeight: 560 }],
    related: ["free/message-scroller", "free/prompt-suggestions", "free/message-actions"],
    tokens: ["color.surface", "color.accent-soft"],
    keywords: ["ai", "chat", "assistant", "conversation", "copilot", "kit"],
    status: "new",
  },
  FREE_CONVERSATION_LIST,
  FREE_MESSAGE_ACTIONS,
  FREE_MESSAGE_SCROLLER,
  FREE_MODEL_PICKER,
  FREE_PROMPT_INPUT,
  FREE_PROMPT_SUGGESTIONS,
  FREE_QUESTIONNAIRE_CARD,
  FREE_REASONING,
  FREE_SHIMMER,
  FREE_SOURCES,
  FREE_VOICE_INPUT,
]);

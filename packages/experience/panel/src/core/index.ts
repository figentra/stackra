/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/panel (the Resource, Widget, Document and Panel kinds, the
 *          metric shapes and the time range input with their shipped schemas, the enums, the data constructors gen
 *          writes into `#stackra/resources`, `#stackra/panels` and `#stackra/slots`, the recorders gen runs, the saved
 *          views with their store port, layouts, key validator and grouping, the display-mode field filter, the line-editor and inert
 *          contribution rules, `registerResources` for the generic resource pages, `pageContextOf` (the AI page context a panel page publishes), and the public types) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schemas are re-exported under their generated names
 *           (`CountMetric$`, `MoneyMetric$`, `SavedView$` with its `SavedViewSort$`, `SavedViewGroup$` and
 *           `SavedViewTotal$`, `TimeRangeInput$`), folding the old `./schemas` entry into `.` so no
 *           symbol is exported from two entries. The builder records, the widget and resource registries, the panel's own i18n keys
 *           and the renderers' helpers are internal: the `./react` and `./native` entries import them by path. The
 *           kind instance bases are types only, so no class skips its options.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0307; the STA-347 stand-in barrel decision; ADR 0490 (`pageContextOf`); ADR 0438 (`defineSlot`,
 *                     `fillSlot` and the shell slot types, stackra-03).
 */
export type { DocumentBase } from "#core/bases/document-base.base";
export { Document } from "#core/bases/document.base";
export type { PanelBase } from "#core/bases/panel-base.base";
export { Panel } from "#core/bases/panel.base";
export type { ResourceBase } from "#core/bases/resource-base.base";
export { Resource } from "#core/bases/resource.base";
export type { WidgetBase } from "#core/bases/widget-base.base";
export { Widget } from "#core/bases/widget.base";
export { Bind } from "#core/constants/bind.constant";
export { Blocks } from "#core/constants/blocks.constant";
export { Column } from "#core/constants/column.constant";
export { COUNT_METRIC_SCHEMA as CountMetric$ } from "#core/constants/count-metric-schema.constant";
export { DateRange } from "#core/constants/date-range.constant";
export { Drill } from "#core/constants/drill.constant";
export { Entry } from "#core/constants/entry.constant";
export { Filter } from "#core/constants/filter.constant";
export { FormField } from "#core/constants/form-field.constant";
export { FormStep } from "#core/constants/form-step.constant";
export { MONEY_METRIC_SCHEMA as MoneyMetric$ } from "#core/constants/money-metric-schema.constant";
export { Placement } from "#core/constants/placement.constant";
export { Relation } from "#core/constants/relation.constant";
export { SAVED_VIEW_GROUP_SCHEMA as SavedViewGroup$ } from "#core/constants/saved-view-group-schema.constant";
export { SAVED_VIEW_SCHEMA as SavedView$ } from "#core/constants/saved-view-schema.constant";
export { SAVED_VIEW_SORT_SCHEMA as SavedViewSort$ } from "#core/constants/saved-view-sort-schema.constant";
export { SAVED_VIEW_TOTAL_SCHEMA as SavedViewTotal$ } from "#core/constants/saved-view-total-schema.constant";
export { Section } from "#core/constants/section.constant";
export { TIME_RANGE_INPUT_SCHEMA as TimeRangeInput$ } from "#core/constants/time-range-input-schema.constant";
export { View } from "#core/constants/view.constant";
export { WidgetDisplay } from "#core/constants/widget-display.constant";
export { ActionPlace } from "#core/enums/action-place.enum";
export { Aggregate } from "#core/enums/aggregate.enum";
export { Count } from "#core/enums/count.enum";
export { DisplayKind } from "#core/enums/display-kind.enum";
export { DocumentLayout } from "#core/enums/document-layout.enum";
export { ExportFormat } from "#core/enums/export-format.enum";
export { FilterComparison } from "#core/enums/filter-comparison.enum";
export { ImportMode } from "#core/enums/import-mode.enum";
export { Place } from "#core/enums/place.enum";
export { PlacementLayer } from "#core/enums/placement-layer.enum";
export { ResourcePage } from "#core/enums/resource-page.enum";
export { TimeRange } from "#core/enums/time-range.enum";
export { ViewLayout } from "#core/enums/view-layout.enum";
export { ViewSharing } from "#core/enums/view-sharing.enum";
export { ViewKeyUnknownError } from "#core/errors/view-key-unknown.error";
export { WidgetSize } from "#core/enums/widget-size.enum";
export { activeContributions } from "#core/functions/active-contributions.function";
export { describeResource } from "#core/functions/describe-resource.function";
export { defineSlot } from "#core/functions/define-slot.function";
export { describeWidget } from "#core/functions/describe-widget.function";
export { document } from "#core/functions/document.function";
export { fillSlot } from "#core/functions/fill-slot.function";
export { groupRows } from "#core/functions/group-rows.function";
export { lineEditorOf } from "#core/functions/line-editor-of.function";
export { pageContextOf } from "#core/functions/page-context-of.function";
export { panels } from "#core/functions/panels.function";
export { registerResources } from "#core/functions/register-resources.function";
export { registerWidgets } from "#core/functions/register-widgets.function";
export { resolvePlacements } from "#core/functions/resolve-placements.function";
export { resource } from "#core/functions/resource.function";
export { slots } from "#core/functions/slots.function";
export { unknownViewKeys } from "#core/functions/unknown-view-keys.function";
export { fieldsForMode } from "#core/functions/fields-for-mode.function";
export { widget } from "#core/functions/widget.function";
export { ViewStore } from "#core/ports/view-store.port";
export { CountMetric } from "#core/schemas/count-metric.schema";
export { MoneyMetric } from "#core/schemas/money-metric.schema";
export { SavedViewGroup } from "#core/schemas/saved-view-group.schema";
export { SavedViewSort } from "#core/schemas/saved-view-sort.schema";
export { SavedViewTotal } from "#core/schemas/saved-view-total.schema";
export { SavedView } from "#core/schemas/saved-view.schema";
export { TimeRangeInput } from "#core/schemas/time-range-input.schema";
export type { Actions } from "#core/types/actions.type";
export type { BindRef } from "#core/types/bind-ref.type";
export type { PanelBlockNode } from "#core/types/panel-block-node.type";
export type { Built } from "#core/types/built.type";
export type { ColumnBuilder } from "#core/types/column-builder.type";
export type { ColumnFactory } from "#core/types/column-factory.type";
export type { ColumnNode } from "#core/types/column-node.type";
export type { CreateInput } from "#core/types/create-input.type";
export type { CustomWidgetProps } from "#core/types/custom-widget-props.type";
export type { DisplayNode } from "#core/types/display-node.type";
export type { Display } from "#core/types/display.type";
export type { DocumentOptions } from "#core/types/document-options.type";
export type { DocumentRange } from "#core/types/document-range.type";
export type { DocumentRouteOptions } from "#core/types/document-route-options.type";
export type { DocumentRoute } from "#core/types/document-route.type";
export type { DrillNode } from "#core/types/drill-node.type";
export type { EntryBuilder } from "#core/types/entry-builder.type";
export type { EntryFactory } from "#core/types/entry-factory.type";
export type { EntryNode } from "#core/types/entry-node.type";
export type { FieldBuilder } from "#core/types/field-builder.type";
export type { FieldFactory } from "#core/types/field-factory.type";
export type { FieldNode } from "#core/types/field-node.type";
export type { FilterBuilder } from "#core/types/filter-builder.type";
export type { FilterFactory } from "#core/types/filter-factory.type";
export type { FilterNode } from "#core/types/filter-node.type";
export type { FormNode } from "#core/types/form-node.type";
export type { FormStepNode } from "#core/types/form-step-node.type";
export type { Form } from "#core/types/form.type";
export type { InfolistNode } from "#core/types/infolist-node.type";
export type { Infolist } from "#core/types/infolist.type";
export type { KpiBuilder } from "#core/types/kpi-builder.type";
export type { KpiNode } from "#core/types/kpi-node.type";
export type { LineEditorPlacement } from "#core/types/line-editor-placement.type";
export type { ListingBuilder } from "#core/types/listing-builder.type";
export type { PageRef } from "#core/types/page-ref.type";
export type { PanelNavigation } from "#core/types/panel-navigation.type";
export type { PanelOptions } from "#core/types/panel-options.type";
export type { PanelRef } from "#core/types/panel-ref.type";
export type { Path } from "#core/types/path.type";
export type { PlacementBuilder } from "#core/types/placement-builder.type";
export type { PlacementNode } from "#core/types/placement-node.type";
export type { QueryInput } from "#core/types/query-input.type";
export type { RelationNode } from "#core/types/relation-node.type";
export type { Relations } from "#core/types/relations.type";
export type { ResourceOperations } from "#core/types/resource-operations.type";
export type { ResourceOptions } from "#core/types/resource-options.type";
export type { ResourceRoutesOptions } from "#core/types/resource-routes-options.type";
export type { ResourceRoutes } from "#core/types/resource-routes.type";
export type { ResourceTree } from "#core/types/resource-tree.type";
export type { SectionBuilder } from "#core/types/section-builder.type";
export type { SlotCardinality } from "#core/types/slot-cardinality.type";
export type { SlotComponent } from "#core/types/slot-component.type";
export type { SlotFill } from "#core/types/slot-fill.type";
export type { SlotGroup } from "#core/types/slot-group.type";
export type { SlotOptions } from "#core/types/slot-options.type";
export type { SlotRef } from "#core/types/slot-ref.type";
export type { SlotTree } from "#core/types/slot-tree.type";
export type { Slot } from "#core/types/slot.type";
export type { SortNode } from "#core/types/sort-node.type";
export type { TableNode } from "#core/types/table-node.type";
export type { Table } from "#core/types/table.type";
export type { ToneRule } from "#core/types/tone-rule.type";
export type { ToneRules } from "#core/types/tone-rules.type";
export type { ViewBuilder } from "#core/types/view-builder.type";
export type { ViewGroup } from "#core/types/view-group.type";
export type { ViewNode } from "#core/types/view-node.type";
export type { Views } from "#core/types/views.type";
export type { WidgetDescriptorOptions } from "#core/types/widget-descriptor-options.type";
export type { WidgetDescriptor } from "#core/types/widget-descriptor.type";
export type { WidgetOptions } from "#core/types/widget-options.type";
export type { WidgetPlaceOptions } from "#core/types/widget-place-options.type";
export type { WidgetRenderer } from "#core/types/widget-renderer.type";
export type { WidgetTree } from "#core/types/widget-tree.type";

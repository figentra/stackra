/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./devtools` entry of @stackra/container until `stackra gen` writes the entry barrels
 *          (STA-339): the container's devtools tab and the `DevtoolsTabSink` shape every package's devtools entry
 *          takes the kit as.
 * Boundary: names each re-export and declares nothing. Development only: no production path imports it (ADR 0246
 *           decision 1). No Pro import.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0246 (decision 4); ADR 0461.
 */
export { defineContainerDevtools } from "#devtools/functions/define-container-devtools.function";
export type { DevtoolsTabSink } from "#devtools/types/devtools-tab-sink.type";
export type { DevtoolsTabSinkDefinition } from "#devtools/types/devtools-tab-sink-definition.type";

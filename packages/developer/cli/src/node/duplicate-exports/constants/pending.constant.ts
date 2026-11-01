/**
 * Stackra file contract:
 * Purpose: `PENDING`, the known duplicate exported names another batch removes (stackra-225 renames, stackra-223,
 *          unfiled gap-analysis rows), name to owner. It only shrinks (rule-gap N-6, stackra-229): an entry that no
 *          longer matches a duplicate is a finding, so it is deleted in the change that removed the copy (moved from
 *          `tools/scripts/duplicate-exports.mjs`).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0305; gap analysis cross-redundancy rows 1, 22 and 23; stackra-224 (STA-1382).
 */

/** The names stackra-225 (STA-1383) renames or gives one home: its issue list plus gap-analysis row 22. */
const BY_225 = [
  "DecideOptions",
  "FormField",
  "Run",
  "Segment",
  "SignatureRequest",
  "decide",
  "providerCodeOf",
  "redact",
  "signal",
];

/** Infrastructure helpers copied between the infra programs (gap-analysis row 14, `@stackra/infra-kit`; no batch yet). */
const INFRA_KIT = [
  "INFRA_RUNWAY_SCHEMA",
  "InfraRunway",
  "MockedResource",
  "PulumiMock",
  "ROOT_SOURCE",
  "ciAccess",
  "costControls",
  "dataKey",
  "egressAddresses",
  "encoreAccess",
  "filesBucket",
  "mockPulumi",
  "outputOf",
  "parseInfraRunway",
  "resolveRef",
];

/** Same name, likely different concept; not reviewed one by one yet (gap-analysis row 22 covers only some). */
const UNREVIEWED = [
  "BINDING_KINDS",
  "CallOptions",
  "CatalogueVersions",
  "CheckOptions",
  "DesktopApp",
  "Extension",
  "FakeAnswer",
  "Field",
  "FieldRule",
  "Form",
  "GeneratedFile",
  "KIND_FOLDERS",
  "Label",
  "LabelFormat",
  "Link",
  "LinkProps",
  "List",
  "LoginDirectoryOptions",
  "MarketContext",
  "Menu",
  "MenuItem",
  "NavigationItem",
  "PathParams",
  "PayInput",
  "Placement",
  "ProviderChoice",
  "PushOptions",
  "QueryOptions",
  "QueryOutput",
  "RenderOptions",
  "RuleDocument",
  "SHAPE_KINDS",
  "SearchHit",
  "Section",
  "SeedResult",
  "TabItem",
  "Table",
  "configKeyOf",
  "entitlementKey",
  "eventName",
  "fieldErrorsOf",
  "issuesOf",
  "messagesOf",
  "modelKey",
  "originOf",
  "permissionKey",
  "registerBlocks",
  "resolveDocument",
  "rollback",
  "rootModuleOf",
  "tableInput",
  "valueAt",
];

/** Known duplicates another batch removes: name to owner. Delete an entry when its batch lands. */
export const PENDING: Readonly<Record<string, string>> = Object.freeze({
  ...Object.fromEntries(BY_225.map((name) => [name, "stackra-225"])),
  ...Object.fromEntries(
    INFRA_KIT.map((name) => [name, "unfiled: gap-analysis row 14 (infra-kit)"]),
  ),
  DeviceOrder: "unfiled: gap-analysis row 11 (@stackra/sync)",
  OfflineCap: "unfiled: gap-analysis row 11 (@stackra/sync)",
  ReplicaRow: "unfiled: gap-analysis row 11 (@stackra/sync)",
  ColumnRecord: "unfiled: gap-analysis redundancy 21 (database vs panel wire shape)",
  MetricValue: "unfiled: gap-analysis redundancy 21 (database vs panel wire shape)",
  refuse: "unfiled: gap-analysis row 17 (refusal builder through errors)",
  HEALTH_CHECK_SCHEMA: "unfiled: stackra-221 gave each package an internal copy",
  hmacKey: "unfiled: notifications' (secret, use) differs from support's internal (bytes)",
  ...Object.fromEntries(UNREVIEWED.map((name) => [name, "unfiled: unreviewed same-name pair"])),
});

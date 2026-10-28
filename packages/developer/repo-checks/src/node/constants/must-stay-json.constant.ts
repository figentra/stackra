/**
 * Stackra file contract:
 * Purpose: `MUST_STAY_JSON`, the JSON files whose reader rejects comments or a .jsonc name, each with the reason. Any other
 *          *.json is a config whose tool reads JSONC, so it must be .jsonc.
 * Boundary: data only; a new entry names the reader and why it cannot take JSONC.
 * Runtime: node
 * Governing contract: the JSON vs JSONC rule (STA-299); ADR 0294 (R10); ADR 0305 (rule 1); ADR 0296; ADR 0002
 *                     (2026-10-27 amendment, the docs layout sweep stackra-177).
 */

/**
 * JSON files whose reader rejects comments or a .jsonc name, each with the reason. Any other *.json is a config whose
 * tool reads JSONC, so it must be .jsonc (tsconfig files and the typescript-config presets keep the .json name tsc
 * resolves but already take comments). A new entry here names the reader and why it cannot take JSONC.
 */
export const MUST_STAY_JSON: readonly (readonly [RegExp, string])[] = [
  [/(^|\/)package\.json$/, "pnpm/npm manifest: strict JSON, fixed name"],
  [
    /(^|\/)tsconfig(\.[\w-]+)?\.json$/,
    "tsc finds tsconfig.json by name; comments allowed in place",
  ],
  [
    /^packages\/tooling\/typescript\/src\/[\w-]+\.json$/,
    "tsconfig presets via package exports; comments allowed",
  ],
  [
    /^tools\/scaffold\/templates\/packages\/tooling\/src\/base\.json$/,
    "generic preset template: rename to .jsonc for a JSONC tool",
  ],
  [/^\.claude\/[\w.-]+\.json$/, "Claude Code settings/launch: fixed .json names"],
  [
    /^\.vscode\/(settings|extensions|launch|tasks)\.json$/,
    "VS Code reads these fixed names (JSONC inside)",
  ],
  [/^\.changeset\/config\.json$/, "@changesets/config JSON.parse on a fixed path"],
  [
    /(^|\/)expo-module\.config\.json$/,
    "Expo autolinking reads this fixed name as strict JSON (ADR 0478)",
  ],
  [/^\.github\/branch-protection\.json$/, "GitHub REST API payload"],
  [/^\.github\/rulesets\/[\w-]+\.json$/, "GitHub REST ruleset payload (PUT …/rulesets/<id>)"],
  [
    /^tools\/schemas\/[\w-]+\.schema\.json$/,
    "JSON Schema documents: editors and validators fetch them by URL or path as JSON",
  ],
  [
    /^packages\/design-system\/tokens\/assets\/data\/[\w-]+\/[\w-]+\.json$/,
    "brand-kit token reports, vendored byte-for-byte; the theme tests JSON.parse them",
  ],
  [
    /^packages\/developer\/runway\/schema\/[\w-]+\.json$/,
    "runway JSON Schemas: shipped as @stackra/runway/schema/<kind>.json for editors and validators",
  ],
  // shortcut: only docs apps not yet swept to the ADR 0002 (2026-10-27) layout keep src/docs.json (OS, Commerce, the
  // products); a swept app's docs.json is generated into gitignored .stackra/site. Delete the row after the last sweep.
  [
    /(^|\/)src\/docs\.json$/,
    "Mintlify parses docs.json with JSON.parse (docs apps before their layout sweep)",
  ],
  [
    /(^|\/)([\w-]+\.)?stackra\.manifest\.json$/,
    "stackra gen writes the committed manifest as strict JSON (ADR 0294 R10); test fixtures copy it",
  ],
  [/(^|\/)(app|eas)\.json$/, "Expo/EAS: fixed names, rewritten by the expo/eas CLIs"],
  [/^\.specify\//, "spec-kit CLI output, read by its scripts with jq / python json"],
  [/^\.(agents|claude)\/skills\//, "vendored skills: upstream content"],
  [
    /^packages\/foundation\/market-packs\/assets\/data\/packs\/[\w-]+\.json$/,
    "market packs: readPackAssets loads them with AssetLibrary.json and the pack hash is over the JSON document",
  ],
  [
    /(^|\/)assets\/lang\/[\w-]+\/[\w-]+\.json$/,
    "lang catalogues are assets/lang/<locale>/<namespace>.json by ADR 0305 (rule 1); @stackra/i18n reads JSON",
  ],
];

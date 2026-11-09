/**
 * Stackra file contract:
 * Purpose: `MUST_STAY_JSON`, the JSON files whose reader rejects comments or a .jsonc name, each with the reason. Any other
 *          *.json is a config whose tool reads JSONC, so it must be .jsonc.
 * Boundary: data only; a new entry names the reader and why it cannot take JSONC.
 * Runtime: node
 * Governing contract: the JSON vs JSONC rule (STA-299); ADR 0294 (R10); ADR 0305 (rule 1); ADR 0296; ADR 0002
 *                     (2026-10-27 amendment, the docs layout sweep stackra-177); ADR 0514 (amendment of 2026-11-09: a docs
 *                     member's meta.json).
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
    /^packages\/developer\/flow-preset\/preset\/surfaces\/settings\.json$/,
    "Flow renders .claude/settings.json from this exact surface name",
  ],
  [
    /^docs\/content\/(?:[\w.-]+\/)*meta\.json$/,
    "Fumadocs reads each folder's navigation from meta.json by that fixed name (ADR 0514, amendment of 2026-11-09)",
  ],
  [
    /^\.vscode\/(settings|extensions|launch|tasks)\.json$/,
    "VS Code reads these fixed names (JSONC inside)",
  ],
  [/^\.changeset\/config\.json$/, "@changesets/config JSON.parse on a fixed path"],
  [
    /^services\/[\w-]+\/assets\/defaults\/[\w-]+\.json$/,
    'a service\'s shipped defaults are imported as JSON modules (`with { type: "json" }`), which take no YAML and no comments',
  ],
  [
    /(^|\/)expo-module\.config\.json$/,
    "Expo autolinking reads this fixed name as strict JSON (ADR 0478)",
  ],
  [
    /^(?:apps\/[\w-]+\/)?brand\.json$/,
    "the brand CLI (figentra-brand pull, and brand-pull.mjs until it ships) reads and writes a product root's or an app's brand.json as strict JSON",
  ],
  [
    /^apps\/[\w-]+\/src\/constants\/brand-themes\/[\w-]+\.json$/,
    "theme-diff layers copied from figentra/brand's brands/<id>/tokens/theme.json; Vite and Metro import them as JSON modules",
  ],
  [
    /^packages\/design-system\/showcase\/(api|search)\/.+\.json$/,
    "@stackra/showcase gen output; the playground's import.meta.glob and the mobile app's require() load it as JSON modules",
  ],
  [
    /^packages\/design-system\/showcase\/vendor\/[\w-]+\/(react|native)\/[\w-]+\.json$/,
    "HeroUI's component docs data, vendored byte-for-byte; gen-api JSON.parses it",
  ],
  [
    /^packages\/[\w-]+\/[\w-]+\/showcase\/[\w-]+\.json$/,
    "a module UI kit's showcase entry; the showcase gen-barrel (load-kit-entries) JSON.parses it (ADR 0504)",
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
  [
    /^packages\/developer\/gen\/schema\/[\w-]+\.json$/,
    "gen JSON Schemas (docs.yaml): shipped as @stackra/gen/schema/<name>.json for editors and validators",
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
  [
    /(^|\/)openapi\.json$/,
    "stackra gen writes each member's committed OpenAPI contract as strict JSON (ADR 0294 R10)",
  ],
  [/(^|\/)(app|eas)\.json$/, "Expo/EAS: fixed names, rewritten by the expo/eas CLIs"],
  [
    /^tools\/lines\/(expected|fixture)\/[\w.-]+\.json$/,
    "fixtures of the lines tool's JSON output, compared byte for byte with what it writes (STA-1794)",
  ],
  [
    /^apps\/[\w-]+\/capabilities\.json$/,
    "Runway's capabilityConfig reads an app's capabilities.json by this fixed name as strict JSON (STA-1794)",
  ],
  [
    /^workers\/[\w-]+\/edge\.json$/,
    "the edge worker's scripts JSON.parse its edge.json (STA-1794)",
  ],
  [/^\.flow\//, "Figentra Flow's lock and spec pointer, read back with JSON.parse (ADR 0510)"],
  [/^\.(agents|claude)\/skills\//, "vendored skills: upstream content"],
  [
    /^packages\/foundation\/market-packs\/assets\/data\/packs\/[\w-]+\.json$/,
    "market packs: readPackAssets loads them with AssetLibrary.json and the pack hash is over the JSON document",
  ],
  [
    /(^|\/)assets\/lang\/(?:[\w-]+\/)?[\w-]+\.json$/,
    "lang catalogues are assets/lang/<locale>/<namespace>.json by ADR 0305 (rule 1), or one assets/lang/<locale>.json per locale in a product repo; @stackra/i18n reads JSON",
  ],
  [
    /(^|\/)assets\/landing\/[\w-]+\.json$/,
    "landing page documents: stackra dev seeds the os/landing shell with the content folder's .json (ADR 0441)",
  ],
  [
    /(^|\/)assets\/seeds\/(?:[\w-]+\/)*[\w-]+\.json$/,
    "seed data: a member's seeders load assets/seeds/<group>/<name>.json as JSON documents (STA-1825)",
  ],
  [
    /^(figentra-)?flow\.config\.json$/,
    "Figentra Flow reads its configuration by this fixed name with JSON.parse (ADR 0503, STA-1729); flow.config.json since 0.2.2 (STA-1942)",
  ],
  [
    /(^|\/)__tests__\/fixtures\/(?:[\w.-]+\/)*[\w.-]+\.json$/,
    "a fixture in a provider's own wire format: a recorded API answer the test parses exactly as the provider sends it",
  ],
  [
    /^tools\/scripts\/__tests__\/__fixtures__\/store\//,
    "recorded App Store Connect, Play and review API payloads, replayed byte-for-byte by store-http.mjs (ADR 0480)",
  ],
];

/**
 * Stackra file contract:
 * Purpose: `renderMaterialCss(theme)`: the glass-system part of the web stylesheet (ADR 0320 as amended 2026-10-31):
 *          - the family blocks: `:root` and `[data-family="front"|"studio"]` map every material role to a level
 *            (`--material-role-<role>-fill`, `-filter`, `-edge`, `-rim`, `-specular`, `-depth`, `-elevation`), the
 *            theme's own family on `:root`;
 *          - the classes, in the components layer: `.material-ultra-thin`, `.material-glass`, `.material-glass-clear`
 *            (and `.material-glass-clear-label`, the label floor), one `.material-role-<role>` per role, the scrolled
 *            nav bar (`[data-scrolled]`), a media control holding a label (`[data-holds="label"]`), the glass press
 *            (`[data-pressed]` on a glass role lifts and brightens) and HeroUI's overlays (popover, menu, toast,
 *            modal, drawer) drawn in their roles wherever the mode is not solid;
 *          - the fallbacks: reduced transparency drops the rim and specular, more contrast the tint and raises the
 *            edge floor and the clear plate, no backdrop filter thickens clear glass by 0.15, forced colours keep an
 *            edge, and reduced motion swaps the materialize animation for a cross-fade.
 *          Every `backdrop-filter` of the system is written here or by the existing material classes: components only
 *          name a class (the `stackra/no-backdrop-filter` lint rule refuses one anywhere else).
 * Boundary: pure; strings only. The colour blocks (`themeVariables`) hold each level's values.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (decisions 1, 4 and 7 as amended 2026-10-31); ADR 0501 (tokens v2, the materials block).
 */
import { MaterialFamily } from "#contracts/enums/material-family.enum";
import type { MaterialLevel } from "#contracts/enums/material-level.enum";
import { MaterialRole } from "#contracts/enums/material-role.enum";
import type { Theme } from "#contracts/types/theme.type";
import { materialRoleLevel } from "#core/functions/material-role-level.function";

/** The parts of one material, as `--material-<owner>-<part>`. */
const PARTS = ["fill", "filter", "edge", "rim", "specular", "depth", "elevation"] as const;

/** No shadow, as a box-shadow layer that keeps a comma list valid. */
const NONE = "0 0 #0000";

/** The opaque surface of a role at `solid`: bars on the page ground, overlays on the overlay role. */
const SOLID_FILL: Partial<Record<MaterialRole, string>> = {
  "nav-bar": "var(--background)",
  sidebar: "var(--surface)",
  sheet: "var(--overlay)",
  modal: "var(--overlay)",
  popover: "var(--overlay)",
  menu: "var(--overlay)",
  toast: "var(--overlay)",
  command: "var(--overlay)",
  tooltip: "var(--overlay)",
  "segmented-track": "var(--default)",
  "search-in-bar": "var(--field-background)",
};

/** The shadow of a role at `solid`. */
const SOLID_ELEVATION: Partial<Record<MaterialRole, string>> = {
  sheet: "var(--overlay-shadow)",
  modal: "var(--overlay-shadow)",
  popover: "var(--overlay-shadow)",
  menu: "var(--overlay-shadow)",
  toast: "var(--overlay-shadow)",
  command: "var(--overlay-shadow)",
  tooltip: "var(--overlay-shadow)",
  "action-bar": "var(--floating-shadow)",
  fab: "var(--floating-shadow)",
};

/** The roles that hold muted text, so their glass takes the thick fill. */
const MUTED_ROLES: ReadonlySet<MaterialRole> = new Set([
  "popover",
  "menu",
  "sheet",
  "command",
  "modal",
]);

/** HeroUI's overlay classes and the role each draws in. */
const HEROUI_ROLES: readonly (readonly [string, MaterialRole])[] = [
  [".popover", "popover"],
  [".dropdown__popover", "menu"],
  [".toast", "toast"],
  [".modal__dialog", "modal"],
  [".drawer__dialog", "sheet"],
];

/** The role variables of `role` drawn at `level`. */
function roleVariables(name: string, role: MaterialRole, level: MaterialLevel | "solid"): string[] {
  const values: Record<(typeof PARTS)[number] | "label-fill", string> =
    level === "solid"
      ? {
          fill: SOLID_FILL[role] ?? "var(--surface)",
          "label-fill": SOLID_FILL[role] ?? "var(--surface)",
          filter: "none",
          edge: "transparent",
          rim: "transparent",
          specular: NONE,
          depth: NONE,
          elevation: SOLID_ELEVATION[role] ?? NONE,
        }
      : ({
          ...Object.fromEntries(PARTS.map((part) => [part, `var(--material-${level}-${part})`])),
          // Popovers, menus, sheets and the palette hold muted text (descriptions, shortcuts), which holds 4.5:1 only
          // on the thick fill (ADR 0320 decision 4): on glass they keep the glass light but take the thick fill.
          ...(MUTED_ROLES.has(role) && level === "glass"
            ? { fill: "var(--material-thick-fill)" }
            : {}),
          "label-fill":
            level === "glass-clear"
              ? `var(--material-${level}-label-fill)`
              : `var(--material-${level}-fill)`,
        } as Record<(typeof PARTS)[number] | "label-fill", string>);
  return Object.entries(values).map(
    ([part, value]) => `  --material-role-${name}-${part}: ${value};`,
  );
}

/** The role map of `family`, as declarations: every role, then the scrolled nav bar (glass in every family). */
function familyDeclarations(theme: Theme, family: MaterialFamily): string[] {
  return [
    ...MaterialRole.flatMap((role) =>
      roleVariables(role, role, materialRoleLevel(theme.materials, family, role)),
    ),
    ...roleVariables(
      "nav-bar-scrolled",
      "nav-bar",
      materialRoleLevel(theme.materials, family, "nav-bar") === "solid"
        ? "glass"
        : materialRoleLevel(theme.materials, family, "nav-bar"),
    ),
  ];
}

/** One drawing rule in the components layer: fill, filter, inset edge, rim, specular and depth, then the elevation. */
const drawRule = (selector: string, owner: string, fill = `var(--${owner}-fill)`) =>
  [
    `  ${selector} {`,
    `    background-color: ${fill};`,
    `    -webkit-backdrop-filter: var(--${owner}-filter);`,
    `    backdrop-filter: var(--${owner}-filter);`,
    `    box-shadow: inset 0 0 0 1px var(--${owner}-edge), inset 0 1px 0 0 var(--${owner}-rim), var(--${owner}-specular), var(--${owner}-depth), inset 0 14px 24px -18px var(--material-sheen-color), var(--${owner}-elevation);`,
    "  }",
  ].join("\n");

/** The material system's part of the stylesheet. */
export function renderMaterialCss(theme: Theme): {
  /** The family blocks, unlayered, after the colour blocks. */
  readonly blocks: readonly string[];
  /** The classes, for the components layer. */
  readonly components: readonly string[];
  /** The fallbacks, after the existing ones. */
  readonly fallbacks: string;
} {
  const own = theme.materials.family ?? "studio";
  // The theme's own family on `:root` first; each `[data-family]` block after it, so an asked-for family wins at the
  // same specificity whichever it is.
  const blocks = [
    [":root {", ...familyDeclarations(theme, own), "}"].join("\n"),
    ...MaterialFamily.map((family) =>
      [`[data-family="${family}"] {`, ...familyDeclarations(theme, family), "}"].join("\n"),
    ),
  ];
  const roleClasses = MaterialRole.map((role) => `.material-role-${role}`);
  // HeroUI's overlays draw in their roles only where glass is asked for, so a solid product keeps HeroUI's look.
  const glassModes =
    (theme.materials.defaultMode ?? "glass") === "solid"
      ? ':root:is([data-material="frosted"], [data-material="glass"], [data-material="liquid"])'
      : ':root:not([data-material="solid"])';
  const components = [
    drawRule(".material-ultra-thin", "material-ultra-thin"),
    drawRule(".material-glass", "material-glass"),
    drawRule(".material-glass-clear", "material-glass-clear"),
    drawRule(
      ".material-glass-clear-label",
      "material-glass-clear",
      "var(--material-glass-clear-label-fill)",
    ),
    ...MaterialRole.map((role) => drawRule(`.material-role-${role}`, `material-role-${role}`)),
    drawRule(".material-role-nav-bar[data-scrolled]", "material-role-nav-bar-scrolled"),
    '  .material-role-media-controls[data-holds="label"] {\n    background-color: var(--material-role-media-controls-label-fill);\n  }',
    // Glass lifts and brightens under the press (iOS 26 interactive glass); solid controls keep their 0.97.
    `  :is(.material-glass, ${roleClasses.join(", ")})[data-pressed] {\n    scale: 1.02;\n    filter: brightness(1.06);\n    transition: scale var(--spring-bouncy-duration, 150ms) var(--spring-bouncy, ease-out), filter var(--spring-bouncy-duration, 150ms) var(--spring-bouncy, ease-out);\n  }`,
    // The glass button (`ButtonVariant` `glass`): the glass level's fill and edge with no backdrop filter and no
    // box-shadow (ADR 0319: a control never blurs, and HeroUI's focus ring is a box-shadow); it lifts when pressed.
    "  .button--glass {\n    background-color: var(--material-glass-fill);\n    border: 1px solid var(--material-glass-edge);\n    color: var(--foreground);\n  }",
    '  .button--glass[data-pressed="true"] {\n    scale: 1.02;\n    filter: brightness(1.06);\n  }',
    // Apple's transient exception: a switch or slider thumb turns glass only while it is held.
    '  .switch[data-pressed="true"] .switch__thumb,\n  .switch:has([data-pressed="true"]) .switch__thumb,\n  .slider__thumb[data-dragging="true"] {\n    background-color: var(--material-glass-fill);\n    scale: 1.08;\n  }',
    // A search field inside a glass bar fills from the bar's search role and never blurs (no nested backdrop root).
    "  :is(.material-role-nav-bar, .material-role-toolbar, .material-role-sidebar) .search-field__group {\n    background-color: var(--material-role-search-in-bar-fill);\n  }",
    ...HEROUI_ROLES.map(([selector, role]) =>
      drawRule(`${glassModes} ${selector}`, `material-role-${role}`),
    ),
  ];
  const forced = [
    ".material-ultra-thin",
    ".material-glass",
    ".material-glass-clear",
    ".material-glass-clear-label",
    ...roleClasses,
  ];
  const fallbacks = [
    // Reduced transparency is the solid mode (the existing block), with no rim light or specular either.
    "@media (prefers-reduced-transparency: reduce) {\n  :root,\n  [data-material] {\n    --material-rim-scale: 0;\n  }\n}",
    // More contrast: no tint, a strong edge on every level, and a lighter plate under media (0.70) than reduced
    // transparency's solid 0.80, which still reads over media.
    "@media (prefers-contrast: more) {\n  :root,\n  [data-material] {\n    --material-tint-scale: 0;\n    --material-edge-floor: 0.45;\n  }\n}",
    "@media (prefers-contrast: more) and (not (prefers-reduced-transparency: reduce)) {\n  :root,\n  [data-material] {\n    --material-clear-floor: 0.7;\n  }\n}",
    // The same, forced by the provider's `data-transparency` and `data-contrast` (the motion family's modes turn the
    // material solid under them). shortcut: a forced contrast over a system-only reduced transparency still sets the
    // 0.70 clear floor; split it when the provider mirrors the system setting into the attribute.
    'html[data-transparency="reduce"],\nhtml[data-transparency="reduce"] [data-material] {\n  --material-rim-scale: 0;\n}',
    'html[data-contrast="more"],\nhtml[data-contrast="more"] [data-theme],\nhtml[data-contrast="more"] [data-material] {\n  --material-tint-scale: 0;\n  --material-edge-floor: 0.45;\n  --material-edge-share: 0.45;\n}',
    'html[data-contrast="more"]:not([data-transparency="reduce"]),\nhtml[data-contrast="more"]:not([data-transparency="reduce"]) [data-material] {\n  --material-clear-floor: 0.7;\n}',
    // Without a backdrop filter clear glass is a plate: its dim 0.15 darker.
    "@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n  :root,\n  .dark,\n  [data-theme] {\n    --material-glass-clear-dim: " +
      String(Math.min(1, (theme.materials.levels["glass-clear"].dim ?? 0.5) + 0.15)) +
      ";\n  }\n}",
    `@media (forced-colors: active) {\n  ${forced.join(",\n  ")} {\n    border: 1px solid CanvasText;\n  }\n}`,
    // Reduced motion (the provider lowers `data-motion` under the system setting): no lift, no scale.
    `:root:is([data-motion="reduced"], [data-motion="none"]) :is(.material-glass, ${roleClasses.join(", ")})[data-pressed],\n:root:is([data-motion="reduced"], [data-motion="none"]) :is(.button--glass[data-pressed="true"], .switch__thumb, .slider__thumb) {\n  scale: none;\n  transition: none;\n}`,
  ].join("\n\n");
  return { blocks, components, fallbacks };
}

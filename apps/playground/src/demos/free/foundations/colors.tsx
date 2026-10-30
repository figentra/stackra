/**
 * Stackra file contract:
 * Purpose: the "colors" demo of the web Foundations.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 2 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { contrastRatio } from "@stackra/tokens";
import contrastReport from "@stackra/tokens/assets/data/stackra/contrast.json";
import type { ColorRole, ColorToken } from "@stackra/tokens/contracts";
import { Heading, useDesignSystem, useCatalogueText } from "@stackra/ui/react";
import { SHOWCASE_THEME } from "#src/constants/showcase-theme.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { FOUNDATIONS_KEYS } from "#src/demos/free/foundations/foundations-keys.constant";

/** The demo's keys. */
const K = FOUNDATIONS_KEYS.foundations;

/** The type specimen on a text pair: letterforms on show, never translated. */
const STRINGS = { specimen: "Aa" } as const;

/** The colour roles by group, each shown once; a `-foreground` partner appears in its base role's pair. */
const ROLE_GROUPS = {
  surfaces: ["background", "surface", "surface-secondary", "surface-tertiary", "overlay"],
  content: ["foreground", "muted", "link"],
  status: ["success", "warning", "danger"],
  fields: ["field-background", "field-placeholder", "field-border"],
  controls: ["default", "accent", "segment", "focus"],
  utility: ["border", "separator", "backdrop"],
} as const satisfies Record<keyof typeof K.groups, readonly ColorRole[]>;

/** One pairing the page checks: the kit's report rows, which name the mode `base` or `dark`. */
interface ContrastPair {
  readonly foreground: string;
  readonly background: string;
  readonly theme: string;
  readonly kind: string;
  readonly minimum: number | null;
}

// The kit predates HeroUI's segment role, so its report has no segment pair; it is checked as text, as the others.
const PAIRS: readonly ContrastPair[] = [
  ...contrastReport,
  ...["base", "dark"].map((theme) => ({
    foreground: "segment-foreground",
    background: "segment",
    theme,
    kind: "text",
    minimum: 4.5,
  })),
];

/** The text a role is read with: `<role>-foreground`, or the two roles named otherwise. */
const READ_WITH: Readonly<Record<string, string>> = {
  background: "foreground",
  "field-background": "field-foreground",
};

/**
 * The contrast pair a role is checked in for a scheme: its own foreground on it, else the role as text on the
 * background, else any pair it is part of.
 */
function pairOf(role: string, theme: "base" | "dark"): ContrastPair | undefined {
  const rows = PAIRS.filter((row) => row.theme === theme);
  const partner = READ_WITH[role] ?? `${role}-foreground`;
  return (
    rows.find((row) => row.background === role && row.foreground === partner) ??
    rows.find((row) => row.foreground === role && row.background === "background") ??
    rows.find((row) => row.foreground === role || row.background === role)
  );
}

const TOKENS: Readonly<Record<string, ColorToken>> = {
  ...SHOWCASE_THEME.colors,
  ...SHOWCASE_THEME.palette,
};

/** The WCAG level a ratio reaches, as the kit's report grades it; a pair with no minimum is decorative. */
const levelOf = (ratio: number, minimum: number | null) =>
  minimum === null
    ? "decorative"
    : ratio >= 7
      ? "AAA"
      : ratio >= 4.5
        ? "AA"
        : ratio >= 3
          ? "AA-large"
          : "fail";

/** A CSS custom property reference. */
const cssVar = (name: string) => `var(--${name})`;

/** Foundations: Colour roles. */
export default function Colors() {
  const t = useCatalogueText(MESSAGES.en);
  const { resolvedColorScheme } = useDesignSystem();

  const dark = resolvedColorScheme === "dark";

  const hexOf = (name: string) => (dark ? TOKENS[name]?.hexDark : TOKENS[name]?.hexLight) ?? "";

  const roleCard = (role: ColorRole) => {
    const pair = pairOf(role, dark ? "dark" : "base");
    const ratio = pair ? contrastRatio(hexOf(pair.foreground), hexOf(pair.background)) : 0;
    return (
      <li key={role} className="grid gap-2 border border-border p-3">
        <div className="h-12 border border-border" style={{ background: cssVar(role) }} />
        <code className="font-mono text-sm">
          <bdi dir="ltr">{role}</bdi>
        </code>
        <span className="font-mono text-xs text-muted">
          <bdi dir="ltr">{hexOf(role)}</bdi>
        </span>
        {pair ? (
          <div className="flex items-center gap-2 text-sm">
            {pair.kind === "text" ? (
              <span
                aria-hidden="true"
                className="border border-border px-2 py-1 font-semibold"
                style={{ background: cssVar(pair.background), color: cssVar(pair.foreground) }}
              >
                {STRINGS.specimen}
              </span>
            ) : null}
            <span>
              <bdi dir="ltr">
                <code>{pair.foreground}</code> / <code>{pair.background}</code>:{" "}
                {`${ratio.toFixed(2)}:1`} ({levelOf(ratio, pair.minimum)})
              </bdi>
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted">{t(K.no_pair)}</span>
        )}
      </li>
    );
  };

  return (
    <div className="grid gap-6">
      <p className="max-w-prose text-muted">
        <bdi>{t(K.colors_note)}</bdi>
      </p>
      {(Object.keys(ROLE_GROUPS) as (keyof typeof ROLE_GROUPS)[]).map((group) => (
        <div key={group} className="grid gap-3">
          <Heading level={3}>{t(K.groups[group])}</Heading>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
            {ROLE_GROUPS[group].map(roleCard)}
          </ul>
        </div>
      ))}
    </div>
  );
}

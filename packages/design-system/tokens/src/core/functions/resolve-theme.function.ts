/**
 * Stackra file contract:
 * Purpose: ADR 0340 decision 2, the one fold of brand over theme: a base theme through any number of layers. Each layer
 *          must extend the current theme's name; each path it changes must be allowed and unlocked by the policy in
 *          force; its changes merge (unsafe keys dropped), the resolved theme takes its name, and every colour it
 *          changes gets its hex recomputed from the oklch value; its own policy narrows the one above for the layers
 *          below, and widening it is refused. The resolved theme then meets the default contrast pairs and the policy's
 *          pairs as painted, and the policy's separation rules as notices.
 * Boundary: pure and total: it never throws. A refusal carries every finding and, for each colour the last layer
 *           changed that fails a pair, the nearest colour that passes; nothing is corrected silently. Path aliases for
 *           renamed tokens (decision 6) come with the versioned diff, later.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decisions 2 to 5).
 */
import type { LayerPolicy } from "#contracts/types/layer-policy.type";
import type { ColorToken, Theme } from "#contracts/types/theme.type";
import type { ThemeDiff } from "#contracts/types/theme-diff.type";
import type { ThemeFinding } from "#contracts/types/theme-finding.type";
import type { ThemeLayer } from "#contracts/types/theme-layer.type";
import type { ThemeVerdict } from "#contracts/types/theme-verdict.type";
import { DEFAULT_CONTRAST_PAIRS } from "#core/constants/default-contrast-pairs.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { checkSeparation } from "#core/functions/check-separation.function";
import { checkTheme } from "#core/functions/check-theme.function";
import { mergeTheme } from "#core/functions/merge-theme.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";
import { suggestColour } from "#core/functions/suggest-colour.function";

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const OKLCH = /^oklch\(/i;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Every leaf path a diff changes, dot-separated, unsafe keys left out. */
function leafPaths(diff: unknown, prefix = ""): string[] {
  if (!isRecord(diff)) return prefix === "" ? [] : [prefix];
  return Object.entries(diff)
    .filter(([key]) => !UNSAFE_KEYS.has(key))
    .flatMap(([key, value]) => leafPaths(value, prefix === "" ? key : `${prefix}.${key}`));
}

/** Whether `pattern` (a path, or a prefix ending in `*`) covers `path`. */
const matches = (path: string, pattern: string) =>
  pattern.endsWith("*")
    ? path.startsWith(pattern.slice(0, -1))
    : path === pattern || path.startsWith(`${pattern}.`);

/** Whether every path `inner` covers is covered by `outer`. */
function within(inner: string, outer: string): boolean {
  const innerPrefix = inner.endsWith("*") ? inner.slice(0, -1) : undefined;
  if (outer.endsWith("*")) return (innerPrefix ?? inner).startsWith(outer.slice(0, -1));
  if (innerPrefix !== undefined) return innerPrefix.startsWith(`${outer}.`);
  return matches(inner, outer);
}

/** The policy in force below a layer: its allow list, every lock, pair and rule from above and from it. */
const narrow = (above: LayerPolicy, own: LayerPolicy): LayerPolicy => ({
  allow: own.allow,
  lock: [...new Set([...(above.lock ?? []), ...(own.lock ?? [])])],
  contrast: [...(above.contrast ?? []), ...(own.contrast ?? [])],
  separate: [...(above.separate ?? []), ...(own.separate ?? [])],
});

/** The hex of an oklch colour, or undefined when the value is not oklch or does not parse. */
function hexOf(value: unknown): string | undefined {
  if (typeof value !== "string" || !OKLCH.test(value)) return undefined;
  try {
    return oklchToHex(value);
  } catch {
    return undefined;
  }
}

/** The layer's colour changes with each changed oklch value's hex beside it. */
function withHexes(group: unknown): unknown {
  if (!isRecord(group)) return group;
  return Object.fromEntries(
    Object.entries(group).map(([name, change]) => {
      if (!isRecord(change)) return [name, change];
      const token: Record<string, unknown> = { ...change };
      const [light, dark] = [hexOf(change["light"]), hexOf(change["dark"])];
      if (light !== undefined) token["hexLight"] = light;
      if (dark !== undefined) token["hexDark"] = dark;
      return [name, token];
    }),
  );
}

/**
 * Folds `base` through `layers`.
 * @param base - the theme the first layer extends, usually `STACKRA_THEME`
 * @param layers - the layers, top first (a brand, then a product, then each tenant)
 * @param rootPolicy - a policy binding the first layer, for an owner who sets rules on their own layer
 * @returns the resolved theme with its notices, or the refusal with its findings and suggestions
 */
export function resolveTheme(
  base: Theme,
  layers: readonly ThemeLayer[],
  rootPolicy?: LayerPolicy,
): ThemeVerdict {
  let theme = base;
  let policy = rootPolicy;
  let changed: string[] = [];
  const findings: ThemeFinding[] = [];
  const refuse = (layer: string, code: ThemeFinding["code"], path: string, detail: string) =>
    findings.push({ code, layer, path, detail });

  for (const layer of layers) {
    if (layer.extends !== theme.name) {
      refuse(
        layer.id,
        "wrong_parent",
        "extends",
        `extends "${layer.extends}", but the theme below is "${theme.name}"`,
      );
      break;
    }
    const paths = leafPaths(layer.changes).filter((path) => path !== "name");
    if (policy)
      for (const path of paths)
        if ((policy.lock ?? []).some((pattern) => matches(path, pattern)))
          refuse(layer.id, "path_locked", path, `${path} is locked by the layer above`);
        else if (!policy.allow.some((pattern) => matches(path, pattern)))
          refuse(
            layer.id,
            "path_not_allowed",
            path,
            `${path} is not among the paths the layer above allows`,
          );
    const changes = layer.changes as Readonly<Record<string, unknown>>;
    const diff = {
      ...changes,
      name: layer.name,
      ...(changes["colors"] === undefined ? {} : { colors: withHexes(changes["colors"]) }),
      ...(changes["palette"] === undefined ? {} : { palette: withHexes(changes["palette"]) }),
    } as ThemeDiff;
    try {
      theme = mergeTheme(theme, diff);
    } catch (error) {
      const problems = error instanceof InvalidThemeError ? error.problems : [String(error)];
      for (const problem of problems)
        refuse(layer.id, "invalid_value", problem.split(" ")[0] ?? "", problem);
      break;
    }
    if (layer.policy) {
      if (policy) {
        const above = policy;
        for (const pattern of layer.policy.allow)
          if (!above.allow.some((outer) => within(pattern, outer)))
            refuse(
              layer.id,
              "policy_widened",
              pattern,
              `${pattern} allows more than the layer above allows`,
            );
      }
      policy = policy ? narrow(policy, layer.policy) : layer.policy;
    }
    changed = paths;
  }
  if (findings.length > 0) return { accepted: false, findings, suggestions: {} };

  const owner = layers.at(-1)?.id ?? base.name;
  const pairs = [...DEFAULT_CONTRAST_PAIRS, ...(policy?.contrast ?? [])];
  const measured = checkTheme(theme, pairs).map((finding) => ({ ...finding, layer: owner }));
  const separation = checkSeparation(theme, policy?.separate ?? []).map((finding) => ({
    ...finding,
    layer: owner,
  }));
  const notices = [
    ...measured.filter((finding) => finding.code === "colour_not_measurable"),
    ...separation,
  ];
  const refusing = measured.filter((finding) => finding.code !== "colour_not_measurable");
  if (refusing.length === 0)
    return { accepted: true, theme, notices, requiresIconAndLabel: separation.length > 0 };

  const suggestions: Record<string, ColorToken> = {};
  const tokens = new Set(
    changed
      .map((path) => path.split(".").slice(0, 2).join("."))
      .filter((path) => /^(colors|palette)\./.test(path)),
  );
  if (refusing.some((finding) => finding.code === "contrast_too_low"))
    for (const path of tokens) {
      const suggestion = suggestColour(theme, path, pairs);
      const token = (path.startsWith("colors.") ? theme.colors : theme.palette) as Readonly<
        Record<string, ColorToken>
      >;
      const current = token[path.split(".")[1] ?? ""];
      if (suggestion && (suggestion.light !== current?.light || suggestion.dark !== current?.dark))
        suggestions[path] = suggestion;
    }
  return { accepted: false, findings: [...refusing, ...notices], suggestions };
}

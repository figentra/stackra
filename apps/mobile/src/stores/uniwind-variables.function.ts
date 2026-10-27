/**
 * Stackra file contract:
 * Purpose: `uniwindVariables`, the HeroUI variables of a theme for each of Uniwind's themes, each value as Uniwind's
 *          runtime takes it (lengths as px numbers, colours as given), leaving out those only its build can convert.
 * Boundary: a pure function; it pushes nothing.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); ADR 0305 (rule 10).
 */
import { themeVariables } from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";
import type { UniwindVariables } from "./uniwind-variables.type";

const LENGTH = /^(-?[\d.]+)(px|rem)$/;

/** A web variable's value as Uniwind's runtime takes it, or `undefined` for one it cannot read. */
function nativeValue(name: string, value: string): string | number | undefined {
  // Shadows hold oklch inside a list, which only Uniwind's build converts; a `var()` is resolved by the built styles.
  if (name.endsWith("-shadow") || value.startsWith("var(")) return undefined;
  const length = LENGTH.exec(value);
  // Uniwind's build turns lengths into px numbers, and its runtime takes values as given.
  if (length) return Number(length[1]) * (length[2] === "rem" ? 16 : 1);
  return value; // A colour: Uniwind's runtime parses oklch.
}

/** `variables` with each value as Uniwind's runtime takes it, leaving out those it cannot read. */
const native = (variables: Readonly<Record<string, string>>) =>
  Object.fromEntries(
    Object.entries(variables).flatMap(([name, value]) => {
      const converted = nativeValue(name, value);
      return converted === undefined ? [] : [[name, converted] as const];
    }),
  );

/** The HeroUI variables of `theme` for each of Uniwind's themes: the mode-independent ones and the mode's. */
export function uniwindVariables(theme: Theme): UniwindVariables {
  const { heroui } = themeVariables(theme);
  return {
    light: native({ ...heroui.root, ...heroui.light }),
    dark: native({ ...heroui.root, ...heroui.dark }),
  };
}

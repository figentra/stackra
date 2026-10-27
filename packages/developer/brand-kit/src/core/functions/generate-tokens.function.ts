/**
 * Stackra file contract:
 * Purpose: `generateTokens`, the `tokens` output: the resolved theme as a full `stackra.theme/1` export and as DTCG
 *          design tokens, both through `@stackra/tokens`.
 * Boundary: pure; writes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended); ADR 0340 (one token engine: @stackra/tokens).
 */
import { exportThemeJson, themeToDtcg } from "@stackra/tokens";

import { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { GeneratedFile } from "#contracts/types/generated-file.type";
import type { KitInput } from "#contracts/types/kit-input.type";

const json = (value: unknown) => new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);

/**
 * The token files.
 *
 * @example
 * const files = await generateTokens(input);
 */
export async function generateTokens(input: KitInput): Promise<GeneratedFile[]> {
  return [
    {
      path: "tokens/theme.json",
      output: BrandOutput.Tokens,
      bytes: json(exportThemeJson(input.theme)),
    },
    {
      path: "tokens/tokens.dtcg.json",
      output: BrandOutput.Tokens,
      bytes: json(themeToDtcg(input.theme)),
    },
  ];
}

/**
 * Stackra file contract:
 * Purpose: `BRAND_THEMES`, the brands the Theme Studio offers: each approved brand of the brand repo whose default
 *          version is approved and ships `tokens/theme.json`, built over the Stackra base. Stackra comes first and is
 *          the showcase's own theme (`SHOWCASE_THEME`).
 * Boundary: data only. `brand-themes/<id>.json` are copies of the brand repo's `brands/<id>/tokens/theme.json`
 *           (figentra/brand 2632b06); Academorix ships no `theme.json` yet, so it is not offered. Last come the
 *           Medusa- and Linear-inspired presets, copies of the playground's (its brand-themes/README.md); their CSS
 *           layers are web-only.
 * Runtime: react-native
 * Governing contract: ADR 0340 (decisions 2, 8 and 11: a brand is a layer above Stackra, never in @stackra/tokens).
 */
import type { Theme } from "@stackra/tokens/contracts";

import { brandTheme } from "./brand-theme.function";
import COMMERCE from "./brand-themes/commerce.json";
import FIGENTRA from "./brand-themes/figentra.json";
import JURISTRA from "./brand-themes/juristra.json";
import JUTE from "./brand-themes/jute.json";
import LINEAR from "./brand-themes/linear.json";
import MEDUSA from "./brand-themes/medusa.json";
import MEZZORA from "./brand-themes/mezzora.json";
import ORGANZA from "./brand-themes/organza.json";
import OS from "./brand-themes/os.json";
import PAY from "./brand-themes/pay.json";
import TAMO from "./brand-themes/tamo.json";
import VELORA from "./brand-themes/velora.json";
import { SHOWCASE_THEME } from "./showcase-theme.constant";

// shortcut: vendored copies of the brand repo's layers; read them from @figentra/brand once the showcase may depend on it.
/** The brands on offer, Stackra (the showcase theme) first; a brand switch swaps the whole base theme. */
export const BRAND_THEMES: readonly { id: string; label: string; theme: Theme }[] = [
  { id: "stackra", label: "Stackra", theme: SHOWCASE_THEME },
  { id: "figentra", label: "Figentra", theme: brandTheme(FIGENTRA) },
  { id: "os", label: "Figentra OS", theme: brandTheme(OS) },
  { id: "commerce", label: "Figentra Commerce", theme: brandTheme(COMMERCE) },
  { id: "pay", label: "Figentra Pay", theme: brandTheme(PAY) },
  { id: "organza", label: "Organza", theme: brandTheme(ORGANZA) },
  { id: "mezzora", label: "Mezzora", theme: brandTheme(MEZZORA) },
  { id: "juristra", label: "Juristra", theme: brandTheme(JURISTRA) },
  { id: "jute", label: "Jute", theme: brandTheme(JUTE) },
  { id: "tamo", label: "Tamo", theme: brandTheme(TAMO) },
  { id: "velora", label: "Velora", theme: brandTheme(VELORA) },
  { id: "medusa", label: "Medusa-inspired", theme: brandTheme(MEDUSA) },
  { id: "linear", label: "Linear-inspired", theme: brandTheme(LINEAR) },
];

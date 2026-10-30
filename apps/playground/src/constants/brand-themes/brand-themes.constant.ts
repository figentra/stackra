/**
 * Stackra file contract:
 * Purpose: `BRAND_THEMES`: the approved brand layers the showcase offers, Stackra first (the showcase default).
 * Boundary: data only. Each `<id>.json` is a copy of the brand repo's `brands/<id>/tokens/theme.json` (figentra/brand
 *           2632b06), taken for every brand whose `brand.json` and `versions.json` default are approved and that
 *           ships a `tokens/theme.json` (Academorix has none yet). Names and display faces are its `brand.json`'s.
 *           Last come two presets inspired by other design systems, Medusa UI and Linear (colours, type, radius and
 *           shadows only; no names or marks of theirs beyond the label), each with a CSS layer; README.md says where
 *           each value came from.
 * Runtime: browser
 * Governing contract: ADR 0340 (decisions 2, 8 and 11: a brand is a layer above Stackra, never in @stackra/tokens).
 */
import COMMERCE from "./commerce.json";
import FIGENTRA from "./figentra.json";
import JURISTRA from "./juristra.json";
import JUTE from "./jute.json";
import LINEAR from "./linear.json";
import LINEAR_CSS from "./linear-preset.css?raw";
import MEDUSA from "./medusa.json";
import MEDUSA_CSS from "./medusa-preset.css?raw";
import MEZZORA from "./mezzora.json";
import ORGANZA from "./organza.json";
import OS from "./os.json";
import PAY from "./pay.json";
import STACKRA from "./stackra.json";
import TAMO from "./tamo.json";
import VELORA from "./velora.json";
import type { BrandTheme } from "./brand-theme.type";

// shortcut: vendored copies of the brand repo's layers; read them from @figentra/brand once the showcase may depend on it.
export const BRAND_THEMES: readonly BrandTheme[] = [
  {
    id: "stackra",
    name: { en: "Stackra", ar: "ستاكرا" },
    display: "Geist Mono",
    displayArabic: "IBM Plex Sans Arabic",
    layer: STACKRA,
  },
  {
    id: "figentra",
    name: { en: "Figentra", ar: "فيجنترا" },
    display: "Geist",
    displayArabic: "IBM Plex Sans Arabic",
    layer: FIGENTRA,
  },
  {
    id: "os",
    name: { en: "Figentra OS", ar: "نظام فيجنترا" },
    display: "Geist",
    displayArabic: "IBM Plex Sans Arabic",
    layer: OS,
  },
  {
    id: "pay",
    name: { en: "Figentra Pay", ar: "فيجنترا باي" },
    display: "Barlow",
    displayArabic: "Tajawal",
    layer: PAY,
  },
  {
    id: "commerce",
    name: { en: "Figentra Commerce", ar: "تجارة فيجنترا" },
    display: "Geist",
    displayArabic: "IBM Plex Sans Arabic",
    layer: COMMERCE,
  },
  {
    id: "organza",
    name: { en: "Organza", ar: "أورجانزا" },
    display: "Bodoni Moda",
    displayArabic: "El Messiri",
    layer: ORGANZA,
  },
  {
    id: "jute",
    name: { en: "Jute", ar: "جوت" },
    display: "Bricolage Grotesque",
    displayArabic: "Baloo Bhaijaan 2",
    layer: JUTE,
  },
  {
    id: "juristra",
    name: { en: "Juristra", ar: "جوريسترا" },
    display: "Fraunces",
    displayArabic: "IBM Plex Sans Arabic",
    layer: JURISTRA,
  },
  {
    id: "mezzora",
    name: { en: "Mezzora", ar: "ميزورا" },
    display: "Geist Mono",
    displayArabic: "Cairo",
    layer: MEZZORA,
  },
  {
    id: "tamo",
    name: { en: "Tamo", ar: "تامو" },
    display: "Readex Pro",
    displayArabic: "Readex Pro",
    layer: TAMO,
  },
  {
    id: "velora",
    name: { en: "Velora", ar: "فيلورا" },
    display: "Cormorant Garamond",
    displayArabic: "Markazi Text",
    layer: VELORA,
  },
  {
    id: "medusa",
    name: { en: "Medusa-inspired", ar: "مستوحى من Medusa" },
    display: "Inter",
    displayArabic: "IBM Plex Sans Arabic",
    layer: MEDUSA,
    css: MEDUSA_CSS,
  },
  {
    id: "linear",
    name: { en: "Linear-inspired", ar: "مستوحى من Linear" },
    display: "Inter",
    displayArabic: "IBM Plex Sans Arabic",
    layer: LINEAR,
    css: LINEAR_CSS,
  },
];

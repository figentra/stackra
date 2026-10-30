/**
 * Stackra file contract:
 * Purpose: `apiDescription`: the description of one API prop in the locale: the `api::<key>.<Part>.<prop>` overlay
 *          of the Arabic catalogue (nested by tier, slug segment, part and prop, as gen-api seeds it) when the locale is Arabic and the overlay has it, else the generated English;
 *          flags a machine-written overlay (`"_status": "machine"` at the file top) so the screen can mark it, and
 *          flags English read in Arabic (`isFallback`) so the screen lays it out as a left-to-right paragraph.
 * Boundary: a pure function over the catalogues; no React.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 7.4 and owner answer Q3 (section 12).
 */
import { type ApiProp, langSegment, lookupMessage } from "@stackra/showcase";

/**
 * The prop's description in `locale`.
 * @param prop - the generated prop
 * @param entryKey - "free/button"
 * @param part - the part name, "Button"
 * @param locale - the app's BCP 47 locale
 * @param overlay - the locale's `api` catalogue, or undefined while none is loaded
 * @returns the text, whether it is a machine translation, and whether it is English standing in for Arabic
 */
export function apiDescription(
  prop: Pick<ApiProp, "name" | "description">,
  entryKey: string,
  part: string,
  locale: string,
  overlay: unknown,
): { readonly text: string; readonly isMachine: boolean; readonly isFallback: boolean } {
  const isArabic = locale.startsWith("ar");
  const english = { text: prop.description, isMachine: false, isFallback: isArabic };
  if (!isArabic || overlay === null || typeof overlay !== "object") return english;
  // "free/action-menu" is the catalogue path "free.action_menu", as gen-api seeds it.
  const path = entryKey.split("/").map(langSegment).join(".");
  const text = lookupMessage(overlay, `api::${path}.${part}.${prop.name}`);
  if (text === undefined) return english;
  return {
    text,
    isMachine: (overlay as Record<string, unknown>)["_status"] === "machine",
    isFallback: false,
  };
}

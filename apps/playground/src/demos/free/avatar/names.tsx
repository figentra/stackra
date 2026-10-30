/**
 * Stackra file contract:
 * Purpose: the "names" demo of the web Avatar: Initials are the first letters of the first and last words; an Arabic
 *          name gives one letter.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Avatar as UiAvatar } from "@stackra/ui/react";

/** The names of the name sample, each beside its initials, and the live sample's cycle. */
const NAMES = [
  { name: "Ada Lovelace", lang: "en" },
  { name: "Plato", lang: "en" },
  { name: "émile zola", lang: "fr" },
  { name: "ليلى أحمد", lang: "ar" },
] as const;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Avatar: Names. */
export default function Names() {
  return (
    <ul className={ROW}>
      {NAMES.map(({ name, lang }) => (
        <li key={name} className="flex items-center gap-2">
          <UiAvatar name={name} data-sample="name" />
          <span lang={lang}>{name}</span>
        </li>
      ))}
    </ul>
  );
}

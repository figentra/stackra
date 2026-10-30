/**
 * Stackra file contract:
 * Purpose: `localizeApiDoc`: an ApiDoc whose prop and event descriptions come from a locale's `api` catalogue
 *          (`assets/lang/<locale>/api.json`, nested by tier, slug segment, part and prop as gen-api seeds it), each
 *          keeping the generated English where the catalogue has no entry.
 * Boundary: a pure function over the doc and the catalogue; loading the catalogue is the app's.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.4; ADR 0080 (translated text).
 */
import { langSegment } from "#src/registry/lang-segment.function";
import { lookupMessage } from "#src/registry/lookup-message.function";
import type { ApiDoc } from "#src/types/api-doc.type";
import type { ApiProp } from "#src/types/api-prop.type";

/**
 * `doc` with its descriptions read from `catalogue`.
 * @param doc - the generated ApiDoc ("free/action-menu")
 * @param catalogue - the locale's `api` catalogue, or undefined while none is loaded
 * @returns the same doc when there is no catalogue, else a copy with the translated descriptions
 */
export function localizeApiDoc(doc: ApiDoc, catalogue: unknown): ApiDoc {
  if (catalogue === null || typeof catalogue !== "object") return doc;
  const root = doc.key.split("/").map(langSegment).join(".");
  return {
    ...doc,
    parts: doc.parts.map((part) => {
      const read = (prop: ApiProp): ApiProp => ({
        ...prop,
        description:
          lookupMessage(catalogue, `api::${root}.${part.name}.${prop.name}`) ?? prop.description,
      });
      return {
        ...part,
        props: part.props.map(read),
        ...(part.events ? { events: part.events.map(read) } : {}),
      };
    }),
  };
}

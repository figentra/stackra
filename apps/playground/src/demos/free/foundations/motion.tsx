/**
 * Stackra file contract:
 * Purpose: the "motion" demo of the web Foundations.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 2 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { useCatalogueText } from "@stackra/ui/react";
import { SHOWCASE_THEME } from "#src/constants/showcase-theme.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { FOUNDATIONS_KEYS } from "#src/demos/free/foundations/foundations-keys.constant";

/** The demo's keys. */
const K = FOUNDATIONS_KEYS.foundations;

/** The Foundations demo: motion. */
export default function Motion() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <table className="w-fit text-start text-sm">
      <thead>
        <tr>
          <th scope="col" className="pe-6 text-start">
            {t(K.name)}
          </th>
          <th scope="col" className="pe-6 text-start">
            {t(K.duration)}
          </th>
          <th scope="col" className="text-start">
            {t(K.easing)}
          </th>
        </tr>
      </thead>
      <tbody className="font-mono">
        {Object.entries(SHOWCASE_THEME.motion).map(([name, step]) => (
          <tr key={name}>
            <th scope="row" className="pe-6 text-start font-normal">
              <bdi dir="ltr">{name}</bdi>
            </th>
            <td className="pe-6">
              <bdi dir="ltr">{step.duration}</bdi>
            </td>
            <td>
              <bdi dir="ltr">{step.easing}</bdi>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

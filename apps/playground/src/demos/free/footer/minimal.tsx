/**
 * Stackra file contract:
 * Purpose: the "minimal" demo of the Footer: only the bottom row, the copyright with the privacy and terms links.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Footer, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FOOTER_KEYS } from "#src/demos/free/footer/footer-keys.constant";

/** The demo's keys. */
const K = FOOTER_KEYS.footer.minimal;

/** A footer with only a copyright line and two legal links. */
export default function Minimal() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Footer
      className="px-2"
      copyright={t(K.copyright)}
      legalLinks={[
        { label: t(K.privacy), href: "#privacy" },
        { label: t(K.terms), href: "#terms" },
      ]}
    />
  );
}

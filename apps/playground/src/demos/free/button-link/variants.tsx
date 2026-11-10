/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web ButtonLink: links drawn in the Button's variants, then in its three sizes.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. Every link points
 *           back at this demo, so following one stays on the page.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); STA-2041.
 */
import { ButtonLink, Text, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";

import { MESSAGES } from "#src/constants/messages.constant";
import { BUTTON_LINK_KEYS } from "#src/demos/free/button-link/button-link-keys.constant";

/** The demo's keys. */
const K = BUTTON_LINK_KEYS.button_link.variants;

/** The row that lays the links out, wrapping on a narrow frame. */
const ROW = "flex flex-wrap items-center gap-3";

/** The ButtonLink demo: Variants. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();
  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}#button-link-variants`;
  const links = [
    { variant: "primary", label: t(K.start) },
    { variant: "secondary", label: t(K.plans) },
    { variant: "tertiary", label: t(K.compare) },
    { variant: "outline", label: t(K.sales) },
    { variant: "ghost", label: t(K.docs) },
  ] as const;
  return (
    <div className="grid gap-4">
      <Text type="small" tone="muted">
        {t(K.variants)}
      </Text>
      <div className={ROW}>
        {links.map((link) => (
          <ButtonLink key={link.variant} href={here} variant={link.variant}>
            {link.label}
          </ButtonLink>
        ))}
      </div>
      <Text type="small" tone="muted">
        {t(K.sizes)}
      </Text>
      <div className={ROW}>
        {(["sm", "md", "lg"] as const).map((size) => (
          <ButtonLink key={size} href={here} size={size}>
            {t(K.start)}
          </ButtonLink>
        ))}
      </div>
    </div>
  );
}

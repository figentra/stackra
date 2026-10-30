/**
 * Stackra file contract:
 * Purpose: the "storefront" demo of the Footer: a linen shop's footer with its brand line, Shop, Help and Company
 *          columns (Instagram leaves the site), the copyright, the legal links and a language switcher.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Footer, LocaleSwitcher, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FOOTER_KEYS } from "#src/demos/free/footer/footer-keys.constant";

/** The demo's keys. */
const K = FOOTER_KEYS.footer.storefront;

/** Footer: a shop's footer. */
export default function Storefront() {
  const t = useCatalogueText(MESSAGES.en);
  const [locale, setLocale] = useState("ar");
  return (
    <Footer
      className="px-2"
      // The page already has the site's own "Footer" navigation; the shop's gets its own name.
      label={t(K.nav)}
      brand={
        <>
          <Text className="text-lg font-semibold">{t(K.brand)}</Text>
          <Text tone="muted" type="small">
            {t(K.tagline)}
          </Text>
        </>
      }
      groups={[
        {
          title: t(K.shop),
          links: [
            { label: t(K.new_in), href: "#new" },
            { label: t(K.abayas), href: "#abayas" },
            { label: t(K.home), href: "#home-linen" },
          ],
        },
        {
          title: t(K.help),
          links: [
            { label: t(K.shipping), href: "#shipping" },
            { label: t(K.returns), href: "#returns" },
            { label: t(K.contact), href: "#contact" },
          ],
        },
        {
          title: t(K.company),
          links: [
            { label: t(K.about), href: "#about" },
            { label: t(K.careers), href: "#careers" },
            { label: t(K.instagram), href: "https://instagram.com", isExternal: true },
          ],
        },
      ]}
      copyright={t(K.copyright)}
      legalLinks={[
        { label: t(K.privacy), href: "#privacy" },
        { label: t(K.terms), href: "#terms" },
      ]}
      localeSwitcher={
        <LocaleSwitcher
          label={t(K.locale)}
          locales={["ar", "en"]}
          value={locale}
          onChange={setLocale}
        />
      }
    />
  );
}

/**
 * Stackra file contract:
 * Purpose: the "packages" demo of the web PackageList: the Stackra packages a billing service is built on, five shown
 *          and the last rows faded to say the list goes on.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. Package names are
 *           npm names, never translated; their descriptions come from the demo's catalogues.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-2041.
 */
import { PackageList, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PACKAGE_LIST_KEYS } from "#src/demos/free/package-list/package-list-keys.constant";

/** The demo's keys. */
const K = PACKAGE_LIST_KEYS.package_list;

/** The packages, in the order a reader meets them. */
const PACKAGES = [
  { name: "@stackra/actions", description: K.actions },
  { name: "@stackra/money", description: K.money },
  { name: "@stackra/events", description: K.events },
  { name: "@stackra/panel", description: K.panel },
  { name: "@stackra/notifications", description: K.notifications },
  { name: "@stackra/integrations", description: K.integrations },
  { name: "@stackra/ui", description: K.ui },
] as const;

/** The PackageList demo: packages. */
export default function Packages() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <PackageList
      label={t(K.label)}
      items={PACKAGES.map((item) => ({ name: item.name, description: t(item.description) }))}
      className="w-full max-w-md"
    />
  );
}

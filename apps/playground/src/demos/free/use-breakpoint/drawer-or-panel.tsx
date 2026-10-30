/**
 * Stackra file contract:
 * Purpose: the "drawer-or-panel" demo of the web useBreakpoint: a product search's filters sit in a side panel on a
 *          tablet or desktop and move into a drawer on a phone, one choice of which component to mount.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import {
  Button,
  Checkbox,
  Drawer as UiDrawer,
  Text,
  useBreakpoint,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { USE_BREAKPOINT_KEYS } from "#src/demos/free/use-breakpoint/use-breakpoint-keys.constant";

/** The demo's keys. */
const K = USE_BREAKPOINT_KEYS.use_breakpoint;

/** The filter's categories. */
const CATEGORIES = ["beverages", "bakery", "dairy", "snacks"] as const;

/** useBreakpoint: Drawer or panel. */
export default function DrawerOrPanel() {
  const t = useCatalogueText(MESSAGES.en);
  const { sizeClass } = useBreakpoint();
  const [isOpen, setIsOpen] = useState(false);
  const [picked, setPicked] = useState<readonly string[]>(["bakery"]);
  const filters = (
    <div className="grid gap-2">
      {CATEGORIES.map((category) => (
        <Checkbox
          key={category}
          label={t(K.category[category])}
          value={picked.includes(category)}
          onChange={(isOn) =>
            setPicked(isOn ? [...picked, category] : picked.filter((id) => id !== category))
          }
        />
      ))}
    </div>
  );
  const results = <Text>{t(K.results, { count: picked.length * 12 })}</Text>;

  if (sizeClass === "phone")
    return (
      <div className="grid gap-3">
        <div>
          <Button variant="secondary" onPress={() => setIsOpen(true)}>
            {t(K.filters)}
          </Button>
        </div>
        {results}
        <UiDrawer isOpen={isOpen} onOpenChange={setIsOpen}>
          <UiDrawer.Close label={t(K.close)} />
          <UiDrawer.Header>
            <UiDrawer.Title>{t(K.filters)}</UiDrawer.Title>
          </UiDrawer.Header>
          <UiDrawer.Body>{filters}</UiDrawer.Body>
        </UiDrawer>
      </div>
    );
  return (
    <div className="grid grid-cols-[12rem_1fr] gap-6">
      <aside aria-label={t(K.filters)} className="border-e border-separator pe-4">
        {filters}
      </aside>
      {results}
    </div>
  );
}

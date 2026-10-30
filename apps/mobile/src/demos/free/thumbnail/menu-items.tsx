/**
 * Stackra file contract:
 * Purpose: the "menu-items" demo of the native Thumbnail: a POS menu list, each item beside its photo or the fallback.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory row 12.
 */
import { Text, Thumbnail, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { THUMBNAIL_DEMO_KEYS } from "#src/demos/free/thumbnail/thumbnail-demo-keys.constant";

/** The demo's keys. */
const K = THUMBNAIL_DEMO_KEYS.demo_free.thumbnail.menu_items;

/** A one-pixel latte-brown PNG, so the sample never touches the network; React Native's Image draws no SVG. */
const PRODUCT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIKekGAAKjAWRgxqrsAAAAAElFTkSuQmCC";

/** Three menu items: with a photo, without one and with a broken one. */
export default function MenuItems() {
  const t = useCatalogueText(MESSAGES.en);
  const items = [
    { id: "latte", name: t(K.latte), category: t(K.drinks), src: PRODUCT },
    { id: "croissant", name: t(K.croissant), category: t(K.bakery) },
    {
      id: "shawarma",
      name: t(K.shawarma),
      category: t(K.mains),
      src: "https://invalid.example/shawarma.png",
    },
  ];
  return (
    <View accessibilityRole="list" accessibilityLabel={t(K.menu)} className="gap-3">
      {items.map((item) => (
        <View key={item.id} className="flex-row items-center gap-3">
          <Thumbnail size="sm" {...(item.src ? { src: item.src } : {})} />
          <View>
            <Text>{item.name}</Text>
            <Text type="small" tone="muted">
              {item.category}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

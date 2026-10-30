/**
 * Stackra file contract:
 * Purpose: the native `Gallery`: pictures as a grid of square tiles or a masonry of their own shapes in columns (each
 *          picture dealt to the shortest column, `masonryColumnsOf`); a press opens the picture in the Lightbox.
 * Boundary: each tile is one button named "Open <alt>"; the gallery is a group named by `label`. Columns follow the
 *           layout direction, so Arabic starts at the right.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); STA-1371 (wave C:
 *          content and media).
 */
import { type ReactElement, useState } from "react";
import { Image, Pressable, View } from "react-native";

import type { GalleryImage } from "#contracts/types/gallery-image.type";
import { MEDIA_KEYS } from "#core/constants/media-keys.constant";
import { masonryColumnsOf } from "#core/functions/masonry-columns-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { GalleryProps } from "#native/gallery/gallery.props";
import { Lightbox } from "#native/lightbox/lightbox";

/** The gallery's keys. */
const K = MEDIA_KEYS.ui.gallery;

/** Pictures in a grid or a masonry that open in a lightbox. */
export function Gallery({
  images,
  label,
  layout = "grid",
  columns = 3,
  hasLightbox = true,
  onImagePress,
  className,
}: GalleryProps): ReactElement {
  const t = useUiText();
  const [open, setOpen] = useState<number | null>(null);

  const tile = (image: GalleryImage, position: number, aspectRatio: number) => (
    <Pressable
      key={image.id}
      accessibilityRole="button"
      accessibilityLabel={t(K.open, { name: image.alt })}
      onPress={() => {
        if (hasLightbox) setOpen(position);
        onImagePress?.(image.id);
      }}
      className="overflow-hidden rounded-[var(--radius-control)] bg-default"
    >
      <Image
        source={{ uri: image.thumbnailSrc ?? image.src }}
        resizeMode="cover"
        style={{ width: "100%", aspectRatio }}
      />
    </Pressable>
  );

  return (
    <View accessibilityLabel={label} className={["w-full", className].filter(Boolean).join(" ")}>
      {layout === "masonry" ? (
        <View className="flex-row gap-2">
          {masonryColumnsOf(images, columns).map((column, at) => (
            // oxlint-disable-next-line react/no-array-index-key -- columns are positions, not records
            <View key={at} className="flex-1 gap-2">
              {column.map(({ image, position }) =>
                tile(image, position, image.width && image.height ? image.width / image.height : 1),
              )}
            </View>
          ))}
        </View>
      ) : (
        <View className="flex-row flex-wrap" style={{ margin: -4 }}>
          {images.map((image, position) => (
            <View key={image.id} style={{ width: `${100 / columns}%`, padding: 4 }}>
              {tile(image, position, 1)}
            </View>
          ))}
        </View>
      )}
      {hasLightbox ? (
        <Lightbox
          images={images}
          label={label}
          isOpen={open !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(null);
          }}
          index={open ?? 0}
          onIndexChange={setOpen}
        />
      ) : null}
    </View>
  );
}

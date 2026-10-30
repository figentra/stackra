/**
 * Stackra file contract:
 * Purpose: the native `ImageCropper`: a frame of a fixed shape (square, wide or round for an avatar) over an image that
 *          people drag to place and zoom with the slider; it reports the kept rectangle in the image's own pixels
 *          after each change.
 * Boundary: React Native's PanResponder for the drag, no gesture library; `Image.getSize` reads the natural size. The
 *           frame is one adjustable element named by `label` with the hint: swiping up or down with a screen reader
 *           zooms. The image always covers the frame (`cropGeometryOf`). Moving is spatial, so it does not mirror.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); WCAG 2.2 SC 2.5.7 (a slider beside the drag);
 *          STA-1371 (wave C: content and media).
 */
import { type ReactElement, useEffect, useRef, useState } from "react";
import { Image, PanResponder, Text, View } from "react-native";

import { MEDIA_KEYS } from "#core/constants/media-keys.constant";
import { cropGeometryOf } from "#core/functions/crop-geometry-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ImageCropperProps } from "#native/image-cropper/image-cropper.props";
import { Slider } from "#native/slider/slider";

/** The cropper's keys. */
const K = MEDIA_KEYS.ui.image_cropper;

/** One screen-reader zoom step. */
const ZOOM_STEP = 0.25;

/** A frame to place and zoom an image in. */
export function ImageCropper({
  src,
  label,
  aspectRatio = 1,
  shape = "rect",
  maxZoom = 3,
  onCropChange,
  className,
}: ImageCropperProps): ReactElement {
  const t = useUiText();
  const [width, setWidth] = useState(0);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // The pan handlers are made once, so they read the latest state through this ref, synced after each render.
  const latest = useRef({ width, natural, zoom, offset, start: offset });
  useEffect(() => {
    latest.current = { ...latest.current, width, natural, zoom, offset };
  });

  const change = (nextZoom: number, nextOffset: { x: number; y: number }) => {
    const size = latest.current.natural;
    if (!size) return;
    const zoomed = Math.max(1, Math.min(maxZoom, nextZoom));
    const next = cropGeometryOf(size, aspectRatio, zoomed, nextOffset);
    setZoom(zoomed);
    setOffset(next.offset);
    onCropChange?.(next.crop);
  };
  const changeRef = useRef(change);
  useEffect(() => {
    changeRef.current = change;
  });

  useEffect(() => {
    Image.getSize(src, (w, h) => {
      const size = { width: w, height: h };
      latest.current.natural = size;
      setNatural(size);
      changeRef.current(1, { x: 0, y: 0 });
    });
  }, [src]);

  // oxlint-disable-next-line react/refs -- reason: the handlers read the refs on a gesture, never while rendering
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        latest.current.start = latest.current.offset;
      },
      onPanResponderMove: (_, gesture) => {
        const { width: frame, start, zoom: now } = latest.current;
        if (frame === 0) return;
        changeRef.current(now, {
          x: start.x + gesture.dx / frame,
          y: start.y + gesture.dy / frame,
        });
      },
    }),
  );

  const geometry = natural ? cropGeometryOf(natural, aspectRatio, zoom, offset) : null;
  return (
    <View className={["w-full gap-3", className].filter(Boolean).join(" ")}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label ?? t(K.label)}
        accessibilityHint={natural ? t(K.hint_touch) : t(K.loading)}
        accessibilityValue={{ text: `${Math.round(zoom * 100)}%` }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) =>
          change(
            zoom + (event.nativeEvent.actionName === "increment" ? ZOOM_STEP : -ZOOM_STEP),
            offset,
          )
        }
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ aspectRatio }}
        className="w-full overflow-hidden rounded-[var(--radius-container)] bg-default"
        {...pan.panHandlers}
      >
        {geometry && width > 0 ? (
          <Image
            source={{ uri: src }}
            style={{
              position: "absolute",
              left: geometry.left * width,
              top: geometry.top * width,
              width: geometry.width * width,
              height: geometry.height * width,
            }}
          />
        ) : null}
        <View
          pointerEvents="none"
          className={[
            "absolute inset-0 border border-white/70",
            shape === "round"
              ? "rounded-[var(--radius-pill)]"
              : "rounded-[var(--radius-container)]",
          ].join(" ")}
        />
      </View>
      <Slider
        label={t(K.zoom)}
        minValue={1}
        maxValue={maxZoom}
        step={0.01}
        value={zoom}
        onChange={(value) => change(value, offset)}
        formatOptions={{ style: "percent", maximumFractionDigits: 0 }}
        isDisabled={!natural}
      />
      <Text className="text-xs text-muted">{natural ? t(K.hint_touch) : t(K.loading)}</Text>
    </View>
  );
}

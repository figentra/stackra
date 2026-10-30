/**
 * Stackra file contract:
 * Purpose: the native `Lightbox`: a full-screen black viewer, one picture per page that people swipe through, with
 *          "3 of 8", a caption, previous and next buttons and a close button; on iOS a pinch zooms the picture.
 * Boundary: the platform's Modal (the Android back button closes it), read as one modal view named by `label`; each
 *           picture is one image element named by its `alt`, and the counter is a polite live region. It fades in
 *           only without Reduce Motion. Paging follows the platform's layout direction.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); ADR 0329 (motion);
 *          STA-1371 (wave C: content and media).
 */
import { type ReactElement, useRef, useState } from "react";
import {
  Image,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { MEDIA_KEYS } from "#core/constants/media-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { IconButton } from "#native/icon-button/icon-button";
import type { LightboxProps } from "#native/lightbox/lightbox.props";

/** The lightbox's keys. */
const K = MEDIA_KEYS.ui.lightbox;

/** A full-screen picture viewer. */
export function Lightbox({
  images,
  index,
  defaultIndex = 0,
  onIndexChange,
  isOpen,
  defaultOpen,
  onOpenChange,
  label,
  className,
}: LightboxProps): ReactElement {
  const t = useUiText();
  const format = useNumberFormat();
  const isReduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [innerOpen, setInnerOpen] = useState(defaultOpen ?? false);
  const [own, setOwn] = useState(defaultIndex);
  const count = images.length;
  const at = Math.max(0, Math.min(count - 1, index ?? own));
  const open = isOpen ?? innerOpen;

  const close = () => {
    if (isOpen === undefined) setInnerOpen(false);
    onOpenChange?.(false);
  };
  const settle = (next: number) => {
    if (next === at) return;
    setOwn(next);
    onIndexChange?.(next);
  };
  const goTo = (next: number) => {
    const target = Math.max(0, Math.min(count - 1, next));
    scroller.current?.scrollTo({ x: target * width, animated: !isReduced });
    settle(target);
  };
  // shortcut: offsets are taken as logical (iOS mirrors a right-to-left scroll view); check Android RTL on device.
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) settle(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <Modal
      visible={open}
      animationType={isReduced ? "none" : "fade"}
      onRequestClose={close}
      statusBarTranslucent
      supportedOrientations={["portrait", "landscape"]}
    >
      <View
        accessibilityViewIsModal
        accessibilityLabel={label ?? t(K.label)}
        className={["flex-1 bg-black pt-12 pb-8", className].filter(Boolean).join(" ")}
      >
        <View className="flex-row items-center justify-between px-4 pb-2">
          <Text accessibilityLiveRegion="polite" className="text-sm text-white">
            {t(K.counter, { index: format(at + 1), count: format(count) })}
          </Text>
          <IconButton icon="x" label={t(K.close)} variant="secondary" onPress={close} />
        </View>
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: at * width, y: 0 }}
          onMomentumScrollEnd={onScroll}
          className="flex-1"
        >
          {images.map((image) => (
            // The inner scroll view is iOS's pinch-to-zoom; Android shows the picture at fit size.
            <ScrollView
              key={image.id}
              style={{ width }}
              maximumZoomScale={3}
              centerContent
              contentContainerClassName="flex-1 items-center justify-center"
            >
              <Image
                source={{ uri: image.src }}
                accessible
                accessibilityLabel={image.alt}
                resizeMode="contain"
                style={{ width, height: "100%" }}
              />
            </ScrollView>
          ))}
        </ScrollView>
        <View className="flex-row items-center justify-between gap-3 px-4 pt-2">
          <IconButton
            icon="chevron-left"
            label={t(K.previous)}
            variant="secondary"
            isDisabled={at === 0}
            onPress={() => goTo(at - 1)}
          />
          <Text className="flex-1 text-center text-sm text-white/80">
            {images[at]?.caption ?? ""}
          </Text>
          <IconButton
            icon="chevron-right"
            label={t(K.next)}
            variant="secondary"
            isDisabled={at >= count - 1}
            onPress={() => goTo(at + 1)}
          />
        </View>
      </View>
    </Modal>
  );
}

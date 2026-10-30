/**
 * Stackra file contract:
 * Purpose: the native `MessageScroller`: the scrolling region of a chat. While the person is at the bottom it follows
 *          new content as it arrives (a streamed answer included); once they scroll up it stays where they read, and a
 *          "New messages" button (with how many arrived) appears when more arrives and takes them back
 *          down. The count is of the children added since they left, so each message is one child.
 * Boundary: a ScrollView that announces changes politely on Android (`accessibilityLiveRegion`); content growth is
 *           its `onContentSizeChange`. The jump animates, and is instant under reduced motion; following stays
 *           instant so it never lags a stream.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3, 4.1.3; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Children, useRef, useState, type ReactElement } from "react";
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { AI_CHAT_KEYS } from "#core/constants/ai-chat-keys.constant";
import { isNearBottom } from "#core/functions/is-near-bottom.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import type { MessageScrollerProps } from "#native/message-scroller/message-scroller.props";

/** The scroller's words. */
const K = AI_CHAT_KEYS.ui.message_scroller;

/** A chat's scrolling region that sticks to the newest message. */
export function MessageScroller({
  children,
  label,
  className,
}: MessageScrollerProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion();
  const scroller = useRef<ScrollView>(null);
  const isSticking = useRef(true);
  const lastTop = useRef(0);
  const lastHeight = useRef(0);
  const [hasNew, setHasNew] = useState(false);
  const count = Children.count(children);
  // How many messages there were when the person scrolled up; null while they are at the bottom.
  const [countWhenLeft, setCountWhenLeft] = useState<number | null>(null);
  const newCount = countWhenLeft === null ? 0 : Math.max(0, count - countWhenLeft);

  const onContentSizeChange = (_width: number, height: number) => {
    const isGrowing = height > lastHeight.current;
    lastHeight.current = height;
    if (isSticking.current) scroller.current?.scrollToEnd({ animated: false });
    else if (isGrowing) setHasNew(true);
  };

  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const top = nativeEvent.contentOffset.y;
    if (isNearBottom(top, nativeEvent.contentSize.height, nativeEvent.layoutMeasurement.height)) {
      isSticking.current = true;
      setCountWhenLeft(null);
      setHasNew(false);
    } else if (top < lastTop.current - 1) {
      // Only the person scrolling up stops the sticking; content growing below never does.
      isSticking.current = false;
      setCountWhenLeft((left) => left ?? count);
    }
    lastTop.current = top;
  };

  const jump = () => {
    isSticking.current = true;
    setHasNew(false);
    setCountWhenLeft(null);
    scroller.current?.scrollToEnd({ animated: !isReduced });
  };

  const isJumpShown = hasNew || newCount > 0;
  return (
    <View className={`min-h-0 flex-1 ${className ?? ""}`}>
      <ScrollView
        ref={scroller}
        accessibilityLabel={label ?? t(K.label)}
        accessibilityLiveRegion="polite"
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={onContentSizeChange}
      >
        {children}
      </ScrollView>
      {isJumpShown ? (
        <View pointerEvents="box-none" className="absolute inset-x-0 bottom-3 items-center">
          <Button size="sm" variant="secondary" endIcon="chevron-down" onPress={jump}>
            {newCount ? t(K.new_messages_count, { count: newCount }) : t(K.new_messages)}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

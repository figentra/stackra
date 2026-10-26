/**
 * Stackra file contract:
 * Purpose: the native `SignatureField`: a box to sign in with a finger or a pen, its strokes drawn with Skia, and under
 *          it a text field to sign by typing a name, the way a screen reader or switch user signs; a clear button
 *          empties both. It reports the drawn path or the typed name, or null, in the web field's `SignatureValue`.
 * Boundary: the mark only: binding it to a document, a signer and evidence is `@stackra/documents`' e-signature port.
 *           Controlled by `value` or holding its own strokes; drawing replaces a typed name and typing replaces a
 *           drawing. Touches are read with React Native's PanResponder and scaled to the box's own units
 *           (`width` x `height`), so a path drawn on a phone replays on the web field. The box is an image named by the
 *           label; the typed field is the accessible way to sign. HeroUI Native Pro has no signature pad, so the box
 *           is the package's own, with `@stackra/ui`'s TextField and Button.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1, 2.5.7 and 3.3.2.
 */
import { Canvas, Path } from "@shopify/react-native-skia";
import { Button, Text, TextField, useThemeColor } from "@stackra/ui/native";
import { useMemo, useRef, useState, type ReactElement } from "react";
import { PanResponder, View, type GestureResponderEvent } from "react-native";

import type { SignatureValue } from "#contracts/types/signature-value.type";
import { pathOfStrokes } from "#core/functions/path-of-strokes.function";
import type { SignatureFieldProps } from "#native/signature-field/signature-field.props";

/** One stroke's points, in the box's units. */
type Stroke = (readonly [number, number])[];

/** A field to sign in, by drawing or by typing. */
export function SignatureField({
  label,
  description,
  errorMessage,
  isRequired,
  isInvalid,
  isDisabled,
  value,
  onChange,
  clearLabel,
  typedLabel,
  width = 400,
  height = 150,
}: SignatureFieldProps): ReactElement {
  const ink = useThemeColor("foreground");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [own, setOwn] = useState<SignatureValue | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  // The drawn width in points, from layout; the box keeps the `width` x `height` ratio.
  const [shownWidth, setShownWidth] = useState(0);
  const current = value === undefined ? own : value;
  const viewBox = `0 0 ${width} ${height}`;

  // The handlers read the latest props and strokes through this ref: PanResponder is created once.
  const latest = useRef({ current, strokes, isDisabled, onChange, shownWidth });
  // oxlint-disable-next-line react/refs -- reason: the ref holds the latest props for gesture handlers created once; it is never read to render
  latest.current = { current, strokes, isDisabled, onChange, shownWidth };

  const report = (next: SignatureValue | null): void => {
    setOwn(next);
    latest.current.onChange?.(next);
  };

  const responder = useMemo(() => {
    /** The touch's position in the box's units. */
    const pointOf = (event: GestureResponderEvent): readonly [number, number] => {
      const shown = latest.current.shownWidth;
      const scale = shown > 0 ? width / shown : 1;
      return [event.nativeEvent.locationX * scale, event.nativeEvent.locationY * scale];
    };
    /** Reports the strokes drawn so far as one path. */
    const finish = (): void => {
      setIsDrawing(false);
      const next: SignatureValue = { kind: "drawn", path: pathOfStrokes(drawn), viewBox };
      setOwn(next);
      latest.current.onChange?.(next);
    };
    let drawn: Stroke[] = [];
    // oxlint-disable-next-line react/refs -- reason: read inside a gesture handler, not during render
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !latest.current.isDisabled,
      onMoveShouldSetPanResponder: () => !latest.current.isDisabled,
      // The box claims the touch, so a scrolling screen does not take a stroke away.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const base = latest.current.current?.kind === "drawn" ? latest.current.strokes : [];
        drawn = [...base, [pointOf(event)]];
        setStrokes(drawn);
        setIsDrawing(true);
      },
      onPanResponderMove: (event) => {
        // oxlint-disable-next-line react/immutability -- reason: `drawn` is the gesture's own stroke buffer, local to the memoised responder
        drawn = [...drawn.slice(0, -1), [...(drawn.at(-1) ?? []), pointOf(event)]];
        setStrokes(drawn);
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  }, [width, viewBox]);

  const clear = (): void => {
    setStrokes([]);
    report(null);
  };

  const drawnPath = isDrawing
    ? pathOfStrokes(strokes)
    : current?.kind === "drawn"
      ? current.path
      : "";
  const scale = shownWidth > 0 ? shownWidth / width : 1;

  return (
    <View testID="signature-field" className="gap-2">
      <Text type="small" className="font-medium">
        {isRequired ? `${label} *` : label}
      </Text>
      <View
        {...responder.panHandlers}
        accessible
        accessibilityRole="image"
        accessibilityLabel={label}
        accessibilityState={{ disabled: Boolean(isDisabled) }}
        onLayout={(layout) => setShownWidth(layout.nativeEvent.layout.width)}
        style={{ aspectRatio: width / height }}
        className={`w-full overflow-hidden rounded-md border bg-surface ${isInvalid ? "border-danger" : "border-border"}`}
      >
        <Canvas style={{ flex: 1 }} pointerEvents="none">
          <Path
            path={drawnPath}
            style="stroke"
            strokeWidth={2}
            strokeCap="round"
            strokeJoin="round"
            color={ink}
            transform={[{ scale }]}
          />
        </Canvas>
      </View>
      <TextField
        label={typedLabel}
        value={current?.kind === "typed" ? current.text : ""}
        onChange={(text) => {
          setStrokes([]);
          report(text.trim() === "" ? null : { kind: "typed", text });
        }}
        isDisabled={isDisabled}
        isRequired={isRequired}
        autoComplete="name"
        textContentType="name"
      />
      {description == null ? null : typeof description === "string" ? (
        <Text type="caption" tone="muted">
          {description}
        </Text>
      ) : (
        description
      )}
      {isInvalid && errorMessage != null ? (
        <View accessibilityLiveRegion="polite" accessibilityRole="alert">
          {typeof errorMessage === "string" ? (
            <Text type="caption" tone="danger">
              {errorMessage}
            </Text>
          ) : (
            errorMessage
          )}
        </View>
      ) : null}
      <View className="flex-row">
        <Button
          size="sm"
          variant="ghost"
          onPress={clear}
          isDisabled={isDisabled || current === null}
        >
          {clearLabel}
        </Button>
      </View>
    </View>
  );
}
